import { OAM_END, OAM_START, REG, TILEMAP } from "@/constants/gpuConstants.js";
import { physics } from "@/emulator/display/screen.js";
import Util from "@/emulator/util/util.js";

function createGPU(mediator) {
  const memory = mediator.getComponent("memory");
  const vram = memory.vram.bind(memory);
  const ioRegister = memory.ioRegister.bind(memory);
  const oam = memory.oamram.bind(memory);

  let clock = 0;
  let mode = 2;
  let line = 0;

  const buffer = new Array(physics.WIDTH * physics.HEIGHT);
  const tileBuffer = new Array(8);

  function drawPixel(x, y, colorValue) {
    buffer[y * 160 + x] = colorValue & 3;
  }

  function getPalette(palette) {
    return [palette & 3, (palette >> 2) & 3, (palette >> 4) & 3, (palette >> 6) & 3];
  }

  function readTileData(tileIndex, tileBaseAddress, tileSize = 0x10) {
    const tileBytes = [];
    const start = tileBaseAddress + tileIndex * tileSize;
    for (let i = 0; i < tileSize; i++) {
      tileBytes.push(vram(start + i));
    }
    return tileBytes;
  }

  function drawTileLine(tileData, lineIndex, flipX = 0, flipY = 0) {
    if (lineIndex < 0 || lineIndex >= 8) return;

    const selectedLine = flipY ? 7 - lineIndex : lineIndex;
    const lowByte = tileData[selectedLine * 2];
    const highByte = tileData[selectedLine * 2 + 1];

    for (let i = 0; i < 8; i++) {
      tileBuffer[i] = 0;
    }

    for (let x = 0; x < 8; x++) {
      const bitIndex = 7 - x;
      const colorValue = ((lowByte >> bitIndex) & 1) | (((highByte >> bitIndex) & 1) << 1);
      const targetX = flipX ? 7 - x : x;
      tileBuffer[targetX] = colorValue;
    }
  }

  function copyTileLine(destination, tileLine, startX) {
    for (let i = 0; i < 8; i++, startX++) {
      if (startX >= 0 && startX < physics.WIDTH) destination[startX] = tileLine[i];
    }
  }

  function copyLineToBuffer(colorIndexLine, lineY) {
    const backgroundPalette = getPalette(ioRegister(REG.BGP));

    for (let screenX = 0; screenX < physics.WIDTH; screenX++) {
      const colorIndex = colorIndexLine[screenX];
      const colorValue = backgroundPalette[colorIndex];
      drawPixel(screenX, lineY, colorValue);
    }
  }

  function drawBackground(LCDC, screenY, colorIndexLine) {
    if (!Util.readBit(LCDC, 0)) return;

    const tileMapStart = Util.readBit(LCDC, 3) ? TILEMAP.START_1 : TILEMAP.START_0;
    const tileDataBase = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const useSignedTileIndex = !Util.readBit(LCDC, 4);

    const scrollX = ioRegister(REG.SCX);
    const scrollY = ioRegister(REG.SCY);

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

  function drawWindow(LCDC) {
    if (!Util.readBit(LCDC, 5)) return;

    const tileMapStart = Util.readBit(LCDC, 6) ? TILEMAP.START_1 : TILEMAP.START_0;
    const tileDataStart = Util.readBit(LCDC, 4) ? 0x8000 : 0x8800;
    const signedIdx = !Util.readBit(LCDC, 4);

    const windowPixelBuffer = new Array(256 * 256);

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

    const windowX = ioRegister(REG.WX) - 7;
    const windowY = ioRegister(REG.WY);

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
        drawPixel(screenX, screenY, windowPixelBuffer[bufferIndex]);
      }
    }
  }

  function drawTile(tileData, screenX, screenY, buffer, bufferWidth, flipX = 0, flipY = 0) {
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

        buffer[pixelIndex] = colorValue;
      }
    }
  }

  function copySpriteTileLine(
    lineBuffer,
    spritePixelLine,
    startX,
    paletteIndex,
    hasPriority,
    backgroundLine,
  ) {
    if (startX >= physics.WIDTH) return;

    for (let i = 0; i < 8; i++) {
      const screenX = startX + i;

      if (screenX < 0 || screenX >= physics.WIDTH) continue;

      const spriteColor = spritePixelLine[i];

      if (spriteColor === 0) continue;

      if (lineBuffer[screenX] && lineBuffer[screenX].color !== 0) continue;

      if (hasPriority && backgroundLine && backgroundLine[screenX] > 0) continue;

      lineBuffer[screenX] = {
        color: spriteColor,
        palette: paletteIndex,
      };
    }
  }

  function copySpriteLineToBuffer(spriteLineBuffer, screenY) {
    const spritePalettes = [getPalette(ioRegister(REG.OBP0)), getPalette(ioRegister(REG.OBP1))];

    for (let screenX = 0; screenX < physics.WIDTH; screenX++) {
      const spritePixel = spriteLineBuffer[screenX];

      if (!spritePixel) continue;

      const { color, palette } = spritePixel;

      if (color === 0) continue;

      const finalColor = spritePalettes[palette][color];
      drawPixel(screenX, screenY, finalColor);
    }
  }

  function drawScanLine(currentScanlineY) {
    const lcdControl = ioRegister(REG.LCDC);

    if (!Util.readBit(lcdControl, 7)) return;

    const colorIndexBuffer = new Array(physics.WIDTH);

    drawBackground(lcdControl, currentScanlineY, colorIndexBuffer);
    drawSprites(lcdControl, currentScanlineY, colorIndexBuffer);
  }

  function drawFrame() {
    const lcdControl = ioRegister(REG.LCDC);

    if (Util.readBit(lcdControl, 7)) {
      drawWindow(lcdControl);
    }

    const screenComponent = mediator.getComponent("screen");
    screenComponent.render(buffer);
  }

  function updateLY() {
    ioRegister(REG.LY, line);

    const statValue = ioRegister(REG.STAT);
    const currentLine = ioRegister(REG.LY);
    const compareLine = ioRegister(REG.LYC);

    if (currentLine === compareLine) {
      ioRegister(REG.STAT, statValue | 0x04);

      if (statValue & 0x40) {
        const cpu = mediator.getComponent("cpu");
        if (cpu) cpu.requestInterrupt(cpu.INTERRUPTS.LCDC);
      }
    } else {
      ioRegister(REG.STAT, statValue & ~0x04);
    }
  }

  function setMode(newMode) {
    mode = newMode;

    const statRegister = ioRegister(REG.STAT) & 0b11111100;
    ioRegister(REG.STAT, statRegister | newMode);

    const interruptCondition = newMode < 3 && statRegister & (1 << (3 + newMode));
    if (interruptCondition) {
      const cpu = mediator.getComponent("cpu");
      if (cpu) cpu.requestInterrupt(cpu.INTERRUPTS.LCDC);
    }
  }

  function update(deltaCycles) {
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

            const cpu = mediator.getComponent("cpu");
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

  const spriteState = {
    cache: new Map(),
    currentLine: 0,
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

  function prepareSpriteData(currentScanlineY) {
    spriteState.currentScanline = currentScanlineY;

    const lcdControl = ioRegister(REG.LCDC);
    if (!Util.readBit(lcdControl, 1)) return;

    const spriteHeight = Util.readBit(lcdControl, 2) ? 16 : 8;
    const visibleSprites = [];

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

  function drawSprites(lcdControl, scanlineY, bgColorBuffer) {
    if (!Util.readBit(lcdControl, 1)) return;

    const spriteHeight = Util.readBit(lcdControl, 2) ? 16 : 8;
    const visibleSprites = [];

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

    const spriteLineBuffer = new Array(physics.WIDTH).fill(null);
    const tileCache = new Map();

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
