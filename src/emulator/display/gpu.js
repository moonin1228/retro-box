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

  const readTileData = (idx, base, size = 0x10) => {
    const out = [];
    const start = base + idx * size;
    for (let i = start; i < start + size; i++) out.push(vram(i));
    return out;
  };

  const drawTileLine = (tileData, line, xflip = 0, yflip = 0) => {
    const l = yflip ? 7 - line : line;
    const b1 = tileData[l * 2];
    const b2 = tileData[l * 2 + 1];
    for (let p = 0; p < 8; p++) {
      const bit = 7 - p;
      const val = ((b1 >> bit) & 1) | (((b2 >> bit) & 1) << 1);
      tileBuffer[xflip ? 7 - p : p] = val;
    }
  };

  const copyTileLine = (dest, src, x) => {
    for (let i = 0; i < 8; i++, x++) if (x >= 0 && x < physics.WIDTH) dest[x] = src[i];
  };
  const copyLineToBuffer = (lineBuf, y) => {
    const pal = getPalette(dev(REG.BGP));
    for (let x = 0; x < physics.WIDTH; x++) drawPixel(x, y, pal[lineBuf[x]]);
  };
  const drawBackground = (LCDC, y, lineBuf) => {
    if (!Util.readBit(LCDC, 0)) return;
    const mapStart = Util.readBit(LCDC, 3) ? TILEMAP.START_1 : TILEMAP.START_0;
    const dataStart = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const signedIdx = !Util.readBit(LCDC, 4);

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
      if (signedIdx) idx = Util.getSignedValue(idx) + 128;
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

    const winBuf = new Array(256 * 256);
    for (let i = 0; i < TILEMAP.LENGTH; i++) {
      let idx = vram(i + mapStart);
      if (signedIdx) idx = Util.getSignedValue(idx) + 128;
      const tData = readTileData(idx, dataStart);
      const tx = i % TILEMAP.WIDTH;
      const ty = (i / TILEMAP.WIDTH) | 0;
      drawTile(tData, tx * 8, ty * 8, winBuf, 256);
    }

    const wx = dev(REG.WX) - 7;
    const wy = dev(REG.WY);
    for (let x = Math.max(0, -wx); x < Math.min(physics.WIDTH, physics.WIDTH - wx); x++) {
      for (let y = Math.max(0, -wy); y < Math.min(physics.HEIGHT, physics.HEIGHT - wy); y++) {
        drawPixel(x + wx, y + wy, winBuf[(x & 255) + (y & 255) * 256]);
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

  const copySpriteTileLine = (dest, src, x, pal, prio, bgLine) => {
    for (let i = 0; i < 8; i++, x++) {
      if (x < 0 || x >= physics.WIDTH) continue;
      if (src[i] === 0) continue;
      if (dest[x]) continue;
      if (prio && bgLine[x] > 0) {
        dest[x] = { color: 0, palette: pal };
        continue;
      }
      dest[x] = { color: src[i], palette: pal };
    }
  };

  const copySpriteLineToBuffer = (lineBuf, y) => {
    const palettes = [getPalette(dev(REG.OBP0)), getPalette(dev(REG.OBP1))];
    for (let x = 0; x < physics.WIDTH; x++) {
      if (!lineBuf[x]) continue;
      const { color, palette } = lineBuf[x];
      if (color === 0) continue;
      drawPixel(x, y, palettes[palette][color]);
    }
  };

  const drawSprites = (LCDC, y, bgLineBuf) => {
    if (!Util.readBit(LCDC, 1)) return;

    const spriteH = Util.readBit(LCDC, 2) ? 16 : 8;

    const sprites = [];

    for (let addr = OAM_START; addr < OAM_END && sprites.length < 10; addr += 4) {
      const sy = oam(addr);
      const sx = oam(addr + 1);
      let idx = oam(addr + 2);
      const flg = oam(addr + 3);

      if (spriteH === 16) idx &= 0xfe;
      if (sy - 16 > y || sy - 16 < y - spriteH) continue;

      sprites.push({ x: sx, y: sy, idx, flags: flg });
    }

    sprites.sort((a, b) => a.x - b.x);
    if (!sprites.length) return;

    const cache = Object.create(null);
    const lineBuf = new Array(physics.WIDTH);

    sprites.forEach((sp) => {
      const tileLine = y - sp.y + 16;
      const palNum = (sp.flags >> 4) & 1;
      const xflip = (sp.flags >> 5) & 1;
      const yflip = (sp.flags >> 6) & 1;
      const prio = (sp.flags >> 7) & 1;

      const tData = (cache[sp.idx] ||= readTileData(sp.idx, 0x8000, spriteH * 2));

      drawTileLine(tData, tileLine, xflip, yflip);
      copySpriteTileLine(lineBuf, tileBuffer, sp.x - 8, palNum, prio, bgLineBuf);
    });

    copySpriteLineToBuffer(lineBuf, y);
  };

  const drawScanLine = (y) => {
    const LCDC = dev(REG.LCDC);
    if (!Util.readBit(LCDC, 7)) return;
    const lineBuf = new Array(physics.WIDTH);
    drawBackground(LCDC, y, lineBuf);
    drawSprites(LCDC, y, lineBuf);
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
    switch (mode) {
      case 0:
        if (clock >= 204) {
          clock -= 204;
          line++;
          updateLY();
          if (line === 144) {
            setMode(1);
            vblank = true;
            cpu.requestInterrupt(cpu.INTERRUPTS.VBLANK);
            drawFrame();
          } else setMode(2);
        }
        break;
      case 1:
        if (clock >= 456) {
          clock -= 456;
          line++;
          if (line > 153) {
            line = 0;
            setMode(2);
          }
          updateLY();
        }
        break;
      case 2:
        if (clock >= 80) {
          clock -= 80;
          setMode(3);
        }
        break;
      case 3:
        if (clock >= 172) {
          clock -= 172;
          drawScanLine(line);
          setMode(0);
        }
        break;
    }
    return vblank;
  };

  return Object.freeze({ update, drawPixel, getPixel, getPalette });
};

export default createGPU;
