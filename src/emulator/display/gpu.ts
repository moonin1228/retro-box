import { OAM_END, OAM_START, REG, TILEMAP } from "@/constants/gpuConstants";
import { physics } from "@/emulator/display/screen";
import Util from "@/emulator/util/util";

interface Memory {
  vram(address: number): number;
  ioRegister(address: number, value?: number): number | void;
  oamram(address: number): number;
}
interface CPU {
  requestInterrupt(id: number): void;
  INTERRUPTS: { LCDC: number; VBLANK: number };
}
interface Screen {
  render(buffer: number[]): void;
}
interface Mediator {
  getComponent<T = unknown>(name: string): T | undefined;
}

type SpritePixel = { color: number; palette: number } | null;
interface SpriteInfo {
  x: number;
  y: number;
  idx: number;
  flags: number;
  priority: number;
}
interface SpriteState {
  cache: Map<number, SpriteInfo[]>;
  currentScanline: number;
  pendingUpdates: Set<number>;
}

function createGPU(mediator: Mediator) {
  const memory = mediator.getComponent<Memory>("memory")!;
  const vram = memory.vram.bind(memory);
  const ioRegister = memory.ioRegister.bind(memory);
  const oam = memory.oamram.bind(memory);

  // 읽기/쓰기 헬퍼 (ioRegister의 return을 단언)
  const readIO = (addr: number) => ioRegister(addr) as number;
  const writeIO = (addr: number, val: number) => void ioRegister(addr, val);

  let clock = 0;
  let mode: 0 | 1 | 2 | 3 = 2;
  let line = 0;

  const buffer: number[] = new Array(physics.WIDTH * physics.HEIGHT).fill(0);
  const tileBuffer: number[] = new Array(8).fill(0);

  function drawPixel(x: number, y: number, colorValue: number) {
    buffer[y * physics.WIDTH + x] = colorValue & 3;
  }

  function getPalette(palette: number) {
    return [palette & 3, (palette >> 2) & 3, (palette >> 4) & 3, (palette >> 6) & 3];
  }

  function readTileData(tileIndex: number, tileBaseAddress: number, tileSize = 0x10) {
    const tileBytes: number[] = [];
    const start = tileBaseAddress + tileIndex * tileSize;
    for (let i = 0; i < tileSize; i++) {
      tileBytes.push(vram(start + i));
    }
    return tileBytes;
  }

  function drawTileLine(tileData: number[], lineIndex: number, flipX = 0, flipY = 0) {
    if (lineIndex < 0 || lineIndex >= 8) return;

    const selectedLine = flipY ? 7 - lineIndex : lineIndex;
    const lowByte = tileData[selectedLine * 2];
    const highByte = tileData[selectedLine * 2 + 1];

    for (let i = 0; i < 8; i++) tileBuffer[i] = 0;

    for (let x = 0; x < 8; x++) {
      const bitIndex = 7 - x;
      const colorValue = ((lowByte >> bitIndex) & 1) | (((highByte >> bitIndex) & 1) << 1);
      const targetX = flipX ? 7 - x : x;
      tileBuffer[targetX] = colorValue;
    }
  }

  function copyTileLine(destination: number[], tileLine: number[], startX: number) {
    for (let i = 0; i < 8; i++, startX++) {
      if (startX >= 0 && startX < physics.WIDTH) destination[startX] = tileLine[i];
    }
  }

  function copyLineToBuffer(colorIndexLine: number[], lineY: number) {
    const backgroundPalette = getPalette(readIO(REG.BGP));

    for (let screenX = 0; screenX < physics.WIDTH; screenX++) {
      const colorIndex = colorIndexLine[screenX] ?? 0;
      const colorValue = backgroundPalette[colorIndex];
      drawPixel(screenX, lineY, colorValue);
    }
  }

  function drawBackground(LCDC: number, screenY: number, colorIndexLine: number[]) {
    if (!Util.readBit(LCDC, 0)) return;

    const tileMapStart = Util.readBit(LCDC, 3) ? TILEMAP.START_1 : TILEMAP.START_0;
    const tileDataBase = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const useSignedTileIndex = !Util.readBit(LCDC, 4);

    const scrollX = readIO(REG.SCX);
    const scrollY = readIO(REG.SCY);

    const tileLineY = (screenY + scrollY) & 7;
    const tileRowIndex = (((screenY + scrollY) / 8) | 0) & 0x1f;

    const firstTileIndex = ((scrollX / 8) | 0) + tileRowIndex * 32;
    let lastTileIndex = firstTileIndex + physics.WIDTH / 8 + 1;

    if ((lastTileIndex & 0x1f) < (firstTileIndex & 0x1f)) {
      lastTileIndex -= 32;
    }

    let drawX = (firstTileIndex & 0x1f) * 8 - scrollX;

    for (
      let tileIndex = firstTileIndex;
      tileIndex !== lastTileIndex;
      tileIndex++, (tileIndex & 0x1f) === 0 ? (tileIndex -= 32) : null
    ) {
      let tileId = vram(tileMapStart + tileIndex);
      if (useSignedTileIndex) {
        tileId = Util.getSignedValue(tileId) + 128;
      }

      const tileData = readTileData(tileId, tileDataBase);
      drawTileLine(tileData, tileLineY);
      copyTileLine(colorIndexLine, tileBuffer, drawX);
      drawX += 8;
    }

    copyLineToBuffer(colorIndexLine, screenY);
  }

  function drawWindow(LCDC: number) {
    if (!Util.readBit(LCDC, 5)) return;

    const tileMapStart = Util.readBit(LCDC, 6) ? TILEMAP.START_1 : TILEMAP.START_0;
    const tileDataStart = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const signedIdx = !Util.readBit(LCDC, 4);

    const windowPixelBuffer: number[] = new Array(256 * 256).fill(0);

    for (let tileMapIndex = 0; tileMapIndex < TILEMAP.LENGTH; tileMapIndex++) {
      let tileId = vram(tileMapStart + tileMapIndex);
      if (signedIdx) {
        tileId = Util.getSignedValue(tileId) + 128;
      }

      const tileData = readTileData(tileId, tileDataStart);
      const tileX = tileMapIndex % TILEMAP.WIDTH;
      const tileY = (tileMapIndex / TILEMAP.WIDTH) | 0;

      drawTile(tileData, tileX * 8, tileY * 8, windowPixelBuffer, 256);
    }

    const windowX = readIO(REG.WX) - 7;
    const windowY = readIO(REG.WY);

    const startX = Math.max(0, -windowX);
    const endX = Math.min(physics.WIDTH, physics.WIDTH - windowX);
    const startY = Math.max(0, -windowY);
    const endY = Math.min(physics.HEIGHT, physics.HEIGHT - windowY);

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const screenX = x + windowX;
        const screenY = y + windowY;

        const tileMapX = x & 255;
        const tileMapY = y & 255;

        const bufferIndex = tileMapX + tileMapY * 256;
        drawPixel(screenX, screenY, windowPixelBuffer[bufferIndex] ?? 0);
      }
    }
  }

  function drawTile(
    tileData: number[],
    screenX: number,
    screenY: number,
    outBuffer: number[],
    bufferWidth: number,
    flipX = 0,
    flipY = 0,
  ) {
    let dataIndex = 0;

    for (let tileLineY = 0; tileLineY < 8; tileLineY++) {
      const lineY = flipY ? 7 - tileLineY : tileLineY;

      const lowByte = tileData[dataIndex++];
      const highByte = tileData[dataIndex++];

      for (let tileLineX = 0; tileLineX < 8; tileLineX++) {
        const bitIndex = 7 - tileLineX;
        const colorValue = ((lowByte >> bitIndex) & 1) | (((highByte >> bitIndex) & 1) << 1);

        const pixelX = flipX ? 7 - tileLineX : tileLineX;
        const pixelIndex = (screenY + lineY) * bufferWidth + (screenX + pixelX);

        outBuffer[pixelIndex] = colorValue;
      }
    }
  }

  function copySpriteTileLine(
    lineBuffer: SpritePixel[],
    spritePixelLine: number[],
    startX: number,
    paletteIndex: number,
    hasPriority: number,
    backgroundLine?: number[],
  ) {
    if (startX >= physics.WIDTH) return;

    for (let i = 0; i < 8; i++) {
      const screenX = startX + i;

      if (screenX < 0 || screenX >= physics.WIDTH) continue;

      const spriteColor = spritePixelLine[i];

      if (spriteColor === 0) continue;

      if (lineBuffer[screenX] && lineBuffer[screenX]!.color !== 0) continue;

      if (hasPriority && backgroundLine && (backgroundLine[screenX] ?? 0) > 0) continue;

      lineBuffer[screenX] = {
        color: spriteColor,
        palette: paletteIndex,
      };
    }
  }

  function copySpriteLineToBuffer(spriteLineBuffer: SpritePixel[], screenY: number) {
    const spritePalettes = [getPalette(readIO(REG.OBP0)), getPalette(readIO(REG.OBP1))];

    for (let screenX = 0; screenX < physics.WIDTH; screenX++) {
      const spritePixel = spriteLineBuffer[screenX];

      if (!spritePixel) continue;

      const { color, palette } = spritePixel;

      if (color === 0) continue;

      const finalColor = spritePalettes[palette][color];
      drawPixel(screenX, screenY, finalColor);
    }
  }

  function drawScanLine(currentScanlineY: number) {
    const lcdControl = readIO(REG.LCDC);

    if (!Util.readBit(lcdControl, 7)) return;

    const colorIndexBuffer: number[] = new Array(physics.WIDTH).fill(0);

    drawBackground(lcdControl, currentScanlineY, colorIndexBuffer);
    drawSprites(lcdControl, currentScanlineY, colorIndexBuffer);
  }

  function drawFrame() {
    const lcdControl = readIO(REG.LCDC);

    if (Util.readBit(lcdControl, 7)) {
      drawWindow(lcdControl);
    }

    const screenComponent = mediator.getComponent<Screen>("screen")!;
    screenComponent.render(buffer);
  }

  function updateLY() {
    writeIO(REG.LY, line);

    const statValue = readIO(REG.STAT);
    const currentLine = readIO(REG.LY);
    const compareLine = readIO(REG.LYC);

    if (currentLine === compareLine) {
      writeIO(REG.STAT, statValue | 0x04);

      if (statValue & 0x40) {
        const cpu = mediator.getComponent<CPU>("cpu");
        if (cpu) cpu.requestInterrupt(cpu.INTERRUPTS.LCDC);
      }
    } else {
      writeIO(REG.STAT, statValue & ~0x04);
    }
  }

  function setMode(newMode: 0 | 1 | 2 | 3) {
    mode = newMode;

    const statRegister = readIO(REG.STAT) & 0b11111100;
    writeIO(REG.STAT, statRegister | newMode);

    const interruptCondition = newMode < 3 && (statRegister & (1 << (3 + newMode))) !== 0;
    if (interruptCondition) {
      const cpu = mediator.getComponent<CPU>("cpu");
      if (cpu) cpu.requestInterrupt(cpu.INTERRUPTS.LCDC);
    }
  }

  function update(deltaCycles: number): boolean {
    clock += deltaCycles;
    let isVBlank = false;

    const MODE_2_CYCLES = 80;
    const MODE_3_CYCLES = 172;
    const MODE_0_CYCLES = 204;
    const TOTAL_LINE_CYCLES = 456;

    switch (mode) {
      case 0: {
        if (clock >= MODE_0_CYCLES) {
          clock -= MODE_0_CYCLES;
          line++;
          updateLY();

          if (line === 144) {
            setMode(1);
            isVBlank = true;

            const cpu = mediator.getComponent<CPU>("cpu");
            if (cpu) cpu.requestInterrupt(cpu.INTERRUPTS.VBLANK);

            drawFrame();
          } else {
            setMode(2);
            updateSpriteState();
          }
        }
        break;
      }

      case 1: {
        if (clock >= TOTAL_LINE_CYCLES) {
          clock -= TOTAL_LINE_CYCLES;
          line++;

          if (line > 153) {
            line = 0;
            setMode(2);
            resetSpriteState();
          }

          updateLY();
        }
        break;
      }

      case 2: {
        if (clock >= MODE_2_CYCLES) {
          clock -= MODE_2_CYCLES;
          setMode(3);
          prepareSpriteData(line);
        }
        break;
      }

      case 3: {
        if (clock >= MODE_3_CYCLES) {
          clock -= MODE_3_CYCLES;
          drawScanLine(line);
          setMode(0);
        }
        break;
      }
    }

    return isVBlank;
  }

  const spriteState: SpriteState = {
    cache: new Map(),
    currentScanline: 0,
    pendingUpdates: new Set(),
  };

  function resetSpriteState() {
    spriteState.cache.clear();
    spriteState.currentScanline = 0;
    spriteState.pendingUpdates.clear();
  }

  function updateSpriteState() {
    if (spriteState.pendingUpdates.size > 0) {
      spriteState.cache.clear();
      spriteState.pendingUpdates.clear();
    }
  }

  function prepareSpriteData(currentScanlineY: number) {
    spriteState.currentScanline = currentScanlineY;

    const lcdControl = readIO(REG.LCDC);
    if (!Util.readBit(lcdControl, 1)) return;

    const spriteHeight = Util.readBit(lcdControl, 2) ? 16 : 8;
    const visibleSprites: SpriteInfo[] = [];

    for (
      let oamAddress = OAM_START;
      oamAddress < OAM_END && visibleSprites.length < 10;
      oamAddress += 4
    ) {
      const spriteY = oam(oamAddress) - 16;
      const spriteX = oam(oamAddress + 1) - 8;
      const tileIndex = oam(oamAddress + 2) & (spriteHeight === 16 ? 0xfe : 0xff);
      const attributeFlags = oam(oamAddress + 3);

      const inVerticalRange =
        spriteY <= currentScanlineY && spriteY + spriteHeight > currentScanlineY;
      const inHorizontalRange = spriteX > -8 && spriteX < physics.WIDTH;

      if (inVerticalRange && inHorizontalRange) {
        visibleSprites.push({
          x: spriteX,
          y: spriteY,
          idx: tileIndex,
          flags: attributeFlags,
          priority: spriteX === 0 ? oamAddress : spriteX,
        });
      }
    }

    visibleSprites.sort((leftSprite, rightSprite) => {
      if (leftSprite.x === rightSprite.x) {
        return leftSprite.priority - rightSprite.priority;
      }
      return leftSprite.x - rightSprite.x;
    });

    spriteState.cache.set(currentScanlineY, visibleSprites);
  }

  function drawSprites(lcdControl: number, scanlineY: number, bgColorBuffer: number[]) {
    if (!Util.readBit(lcdControl, 1)) return;

    const spriteHeight = Util.readBit(lcdControl, 2) ? 16 : 8;
    const visibleSprites: SpriteInfo[] = [];

    for (let oamAddr = OAM_START; oamAddr < OAM_END && visibleSprites.length < 10; oamAddr += 4) {
      const spriteY = oam(oamAddr) - 16;
      const spriteX = oam(oamAddr + 1) - 8;
      let tileIndex = oam(oamAddr + 2);
      const flags = oam(oamAddr + 3);

      if (spriteHeight === 16) tileIndex &= 0xfe;

      const withinY = scanlineY >= spriteY && scanlineY < spriteY + spriteHeight;
      const withinX = spriteX > -8 && spriteX < physics.WIDTH;
      if (!withinY || !withinX) continue;

      visibleSprites.push({
        x: spriteX,
        y: spriteY,
        idx: tileIndex,
        flags,
        priority: visibleSprites.length,
      });
    }

    visibleSprites.sort((spriteA, spriteB) => {
      if (spriteA.x === spriteB.x) {
        return spriteA.priority - spriteB.priority;
      }
      return spriteA.x - spriteB.x;
    });

    const spriteLineBuffer: SpritePixel[] = new Array(physics.WIDTH).fill(null);
    const tileCache = new Map<number, number[]>();

    visibleSprites.forEach((sprite) => {
      const lineInTile = scanlineY - sprite.y;
      let tileIndex = sprite.idx;

      if (spriteHeight === 16 && lineInTile >= 8) {
        tileIndex++;
      }

      let tileData = tileCache.get(tileIndex);
      if (!tileData) {
        tileData = readTileData(tileIndex, 0x8000, 16);
        tileCache.set(tileIndex, tileData);
      }

      const effectiveLine = spriteHeight === 16 && lineInTile >= 8 ? lineInTile - 8 : lineInTile;

      const flipX = (sprite.flags >> 5) & 1;
      const flipY = (sprite.flags >> 6) & 1;
      const paletteIndex = (sprite.flags >> 4) & 1;
      const hasBgPriority = (sprite.flags >> 7) & 1;

      drawTileLine(tileData, effectiveLine, flipX, flipY);
      copySpriteTileLine(
        spriteLineBuffer,
        tileBuffer,
        sprite.x,
        paletteIndex,
        hasBgPriority,
        bgColorBuffer,
      );
    });

    copySpriteLineToBuffer(spriteLineBuffer, scanlineY);
  }

  return Object.freeze({
    update,
    drawPixel,
    getPalette,
  });
}
export default createGPU;
