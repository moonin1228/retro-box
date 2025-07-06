import { physics } from "@/emulator/display/screen.js";
import Util from "@/emulator/util/util.js";

const REG = {
  LCDC: 0xff40,
  STAT: 0xff41,
  SCY: 0xff42,
  SCX: 0xff43,
  LY: 0xff44,
  LYC: 0xff45,
  BGP: 0xff47,
  OBP0: 0xff48,
  OBP1: 0xff49,
  WY: 0xff4a,
  WX: 0xff4b,
};

const OAM_START = 0xfe00;
const OAM_END = 0xfe9f;

const TILEMAP = Object.freeze({
  HEIGHT: 32,
  WIDTH: 32,
  START_0: 0x9800,
  START_1: 0x9c00,
  LENGTH: 0x0400,
});

export const createGPU = (screen, cpu) => {
  const vram = cpu.memory.vram.bind(cpu.memory);
  const dev = cpu.memory.deviceram.bind(cpu.memory);
  const oam = cpu.memory.oamram.bind(cpu.memory);

  let clock = 0;
  let mode = 2;
  let line = 0;

  const buffer = new Array(physics.WIDTH * physics.HEIGHT);
  const tileBuffer = new Array(8);

  const drawPixel = (x, y, c) => (buffer[y * 160 + x] = c & 3);
  const getPixel = (x, y) => buffer[y * 160 + x];

  const getPalette = (p) => [p & 3, (p >> 2) & 3, (p >> 4) & 3, (p >> 6) & 3];

  const readTileData = (index, base, size = 0x10) => {
    const out = [];
    const start = base + index * size;

    for (let i = 0; i < size; i++) {
      out.push(vram(start + i));
    }
    return out;
  };

  const drawTileLine = (tileData, line, xflip = 0, yflip = 0) => {
    if (line < 0 || line >= 8) return;

    const l = yflip ? 7 - line : line;
    const b1 = tileData[l * 2];
    const b2 = tileData[l * 2 + 1];

    for (let i = 0; i < 8; i++) {
      tileBuffer[i] = 0;
    }

    for (let tileX = 0; tileX < 8; tileX++) {
      const bit = 7 - tileX;
      const value = ((b1 >> bit) & 1) | (((b2 >> bit) & 1) << 1);
      const px = xflip ? 7 - tileX : tileX;
      tileBuffer[px] = value;
    }
  };

  const copyTileLine = (destination, src, x) => {
    for (let i = 0; i < 8; i++, x++) if (x >= 0 && x < physics.WIDTH) destination[x] = src[i];
  };

  const copyLineToBuffer = (lineBuf, y) => {
    const palette = getPalette(dev(REG.BGP));
    for (let x = 0; x < physics.WIDTH; x++) drawPixel(x, y, palette[lineBuf[x]]);
  };

  const drawBackground = (LCDC, y, lineBuf) => {
    if (!Util.readBit(LCDC, 0)) return;
    const mapStart = Util.readBit(LCDC, 3) ? TILEMAP.START_1 : TILEMAP.START_0;
    const dataStart = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const signedIndex = !Util.readBit(LCDC, 4);

    const bgx = dev(REG.SCX);
    const bgy = dev(REG.SCY);
    const tileLine = (y + bgy) & 7;
    const tileRow = (((bgy + y) / 8) | 0) & 0x1f;
    const firstTile = ((bgx / 8) | 0) + 32 * tileRow;
    let lastTile = firstTile + physics.WIDTH / 8 + 1;
    if ((lastTile & 0x1f) < (firstTile & 0x1f)) lastTile -= 32;

    let px = (firstTile & 0x1f) * 8 - bgx;
    for (let t = firstTile; t !== lastTile; t++, (t & 0x1f) === 0 ? (t -= 32) : null) {
      let idx = vram(t + mapStart);
      if (signedIndex) idx = Util.getSignedValue(idx) + 128;
      const tileData = readTileData(idx, dataStart);
      drawTileLine(tileData, tileLine);
      copyTileLine(lineBuf, tileBuffer, px);
      px += 8;
    }
    copyLineToBuffer(lineBuf, y);
  };

  const drawWindow = (LCDC) => {
    if (!Util.readBit(LCDC, 5)) return;
    const mapStart = Util.readBit(LCDC, 6) ? TILEMAP.START_1 : TILEMAP.START_0;
    const dataStart = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const signedIdx = !Util.readBit(LCDC, 4);

    const windowBuffer = new Array(256 * 256);
    for (let tileMapIndex = 0; tileMapIndex < TILEMAP.LENGTH; tileMapIndex++) {
      let idx = vram(tileMapIndex + mapStart);
      if (signedIdx) idx = Util.getSignedValue(idx) + 128;
      const tData = readTileData(idx, dataStart);
      const tx = tileMapIndex % TILEMAP.WIDTH;
      const ty = (tileMapIndex / TILEMAP.WIDTH) | 0;
      drawTile(tData, tx * 8, ty * 8, windowBuffer, 256);
    }

    const wx = dev(REG.WX) - 7;
    const wy = dev(REG.WY);
    for (let x = Math.max(0, -wx); x < Math.min(physics.WIDTH, physics.WIDTH - wx); x++) {
      for (let y = Math.max(0, -wy); y < Math.min(physics.HEIGHT, physics.HEIGHT - wy); y++) {
        drawPixel(x + wx, y + wy, windowBuffer[(x & 255) + (y & 255) * 256]);
      }
    }
  };

  const drawTile = (data, x, y, buf, w, xf = 0, yf = 0) => {
    let i = 0;
    for (let ly = 0; ly < 8; ly++) {
      const l = yf ? 7 - ly : ly;
      const b1 = data[i++];
      const b2 = data[i++];
      for (let p = 0; p < 8; p++) {
        const bit = 7 - p;
        const val = ((b1 >> bit) & 1) | (((b2 >> bit) & 1) << 1);
        const px = xf ? 7 - p : p;
        buf[x + px + (y + l) * w] = val;
      }
    }
  };

  const copySpriteTileLine = (destination, src, x, pal, priority, bgLine) => {
    if (x >= physics.WIDTH) return;

    for (let i = 0; i < 8; i++) {
      const screenX = x + i;
      if (screenX < 0 || screenX >= physics.WIDTH) continue;

      if (src[i] === 0) continue;

      if (destination[screenX] && destination[screenX].color !== 0) {
        continue;
      }

      if (priority && bgLine && bgLine[screenX] > 0) {
        continue;
      }

      destination[screenX] = { color: src[i], palette: pal };
    }
  };

  const copySpriteLineToBuffer = (lineBuffer, y) => {
    const palettes = [getPalette(dev(REG.OBP0)), getPalette(dev(REG.OBP1))];
    for (let x = 0; x < physics.WIDTH; x++) {
      if (!lineBuffer[x]) continue;
      const { color, palette } = lineBuffer[x];
      if (color === 0) continue;
      drawPixel(x, y, palettes[palette][color]);
    }
  };

  const drawScanLine = (y) => {
    const LCDC = dev(REG.LCDC);
    if (!Util.readBit(LCDC, 7)) return;
    const lineBuffer = new Array(physics.WIDTH);
    drawBackground(LCDC, y, lineBuffer);
    drawSprites(LCDC, y, lineBuffer);
  };

  const drawFrame = () => {
    const LCDC = dev(REG.LCDC);
    if (Util.readBit(LCDC, 7)) drawWindow(LCDC);
    screen.render(buffer);
  };

  const updateLY = () => {
    dev(REG.LY, line);
    const STAT = dev(REG.STAT);
    if (dev(REG.LY) === dev(REG.LYC)) {
      dev(REG.STAT, STAT | 0x04);
      if (STAT & 0x40) cpu.requestInterrupt(cpu.INTERRUPTS.LCDC);
    } else dev(REG.STAT, STAT & ~0x04);
  };

  const setMode = (m) => {
    mode = m;
    const s = dev(REG.STAT) & 0xfc;
    dev(REG.STAT, s | m);
    if (m < 3 && s & (1 << (3 + m))) cpu.requestInterrupt(cpu.INTERRUPTS.LCDC);
  };

  const update = (delta) => {
    clock += delta;
    let vblank = false;

    const CYCLES_MODE_2 = 80;
    const CYCLES_MODE_3 = 172;
    const CYCLES_MODE_0 = 204;
    const CYCLES_PER_LINE = 456;

    switch (mode) {
      case 0:
        if (clock >= CYCLES_MODE_0) {
          clock -= CYCLES_MODE_0;
          line++;
          updateLY();

          if (line === 144) {
            setMode(1);
            vblank = true;
            cpu.requestInterrupt(cpu.INTERRUPTS.VBLANK);
            drawFrame();
          } else {
            setMode(2);
            updateSpriteState();
          }
        }
        break;

      case 1:
        if (clock >= CYCLES_PER_LINE) {
          clock -= CYCLES_PER_LINE;
          line++;
          if (line > 153) {
            line = 0;
            setMode(2);
            resetSpriteState();
          }
          updateLY();
        }
        break;

      case 2:
        if (clock >= CYCLES_MODE_2) {
          clock -= CYCLES_MODE_2;
          setMode(3);
          prepareSpriteData(line);
        }
        break;

      case 3:
        if (clock >= CYCLES_MODE_3) {
          clock -= CYCLES_MODE_3;
          drawScanLine(line);
          setMode(0);
        }
        break;
    }
    return vblank;
  };

  const spriteState = {
    cache: new Map(),
    currentLine: 0,
    pendingUpdates: new Set(),
  };

  const resetSpriteState = () => {
    spriteState.cache.clear();
    spriteState.currentLine = 0;
    spriteState.pendingUpdates.clear();
  };

  const updateSpriteState = () => {
    if (spriteState.pendingUpdates.size > 0) {
      spriteState.cache.clear();
      spriteState.pendingUpdates.clear();
    }
  };

  const prepareSpriteData = (currentLine) => {
    spriteState.currentLine = currentLine;
    const LCDC = dev(REG.LCDC);
    if (!Util.readBit(LCDC, 1)) return;

    const spriteH = Util.readBit(LCDC, 2) ? 16 : 8;
    const sprites = [];

    for (let addr = OAM_START; addr < OAM_END && sprites.length < 10; addr += 4) {
      const sy = oam(addr) - 16;
      const sx = oam(addr + 1) - 8;
      const idx = oam(addr + 2) & (spriteH === 16 ? 0xfe : 0xff);
      const flags = oam(addr + 3);

      if (sy <= currentLine && sy + spriteH > currentLine && sx > -8 && sx < physics.WIDTH) {
        sprites.push({
          x: sx,
          y: sy,
          idx,
          flags,
          priority: sx === 0 ? addr : sx,
        });
      }
    }

    sprites.sort((a, b) => {
      if (a.x === b.x) return a.priority - b.priority;
      return a.x - b.x;
    });

    spriteState.cache.set(currentLine, sprites);
  };

  const drawSprites = (LCDC, y, bgLineBuf) => {
    if (!Util.readBit(LCDC, 1)) return;

    const spriteH = Util.readBit(LCDC, 2) ? 16 : 8;
    const sprites = [];

    for (let addr = OAM_START; addr < OAM_END && sprites.length < 10; addr += 4) {
      const sy = oam(addr) - 16;
      const sx = oam(addr + 1) - 8;
      let idx = oam(addr + 2);
      const flags = oam(addr + 3);

      if (spriteH === 16) {
        idx &= 0xfe;
      }

      const spriteBottom = sy + spriteH;
      if (y < sy || y >= spriteBottom) continue;
      if (sx <= -8 || sx >= physics.WIDTH) continue;

      sprites.push({
        x: sx,
        y: sy,
        idx,
        flags,
        priority: sprites.length,
      });
    }

    sprites.sort((a, b) => {
      if (a.x === b.x) {
        return a.priority - b.priority;
      }
      return a.x - b.x;
    });

    const lineBuf = new Array(physics.WIDTH).fill(null);
    const tileCache = new Map();

    sprites.forEach((sp) => {
      const tileLine = y - sp.y;
      let tileIndex = sp.idx;

      if (spriteH === 16 && tileLine >= 8) {
        tileIndex = sp.idx + 1;
      }

      let tileData = tileCache.get(tileIndex);
      if (!tileData) {
        tileData = readTileData(tileIndex, 0x8000, 16);
        tileCache.set(tileIndex, tileData);
      }

      let effectiveLine = tileLine;

      if (spriteH === 16 && tileLine >= 8) {
        effectiveLine = tileLine - 8;
      }

      const xflip = (sp.flags >> 5) & 1;
      const yflip = (sp.flags >> 6) & 1;
      const palNum = (sp.flags >> 4) & 1;
      const prio = (sp.flags >> 7) & 1;

      drawTileLine(tileData, effectiveLine, xflip, yflip);
      copySpriteTileLine(lineBuf, tileBuffer, sp.x, palNum, prio, bgLineBuf);
    });

    copySpriteLineToBuffer(lineBuf, y);
  };

  return Object.freeze({ update, drawPixel, getPixel, getPalette });
};

export default createGPU;
