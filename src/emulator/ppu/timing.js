import { PPU_MODES, TIMING_CONSTANTS } from "@/constants/ppuConstants.js";

import { renderBGScanline } from "./background.js";
import { setMode } from "./ppu.js";

export const stepScanline = (ppu) => {
  let newPPU = { ...ppu };

  if (newPPU.registers.LY < TIMING_CONSTANTS.VISIBLE_LINES) {
    if (newPPU.scanlineCycles < TIMING_CONSTANTS.OAM_SCAN_CYCLES) {
      newPPU = setMode(newPPU, PPU_MODES.OAM_SCAN);
    } else if (
      newPPU.scanlineCycles <
      TIMING_CONSTANTS.OAM_SCAN_CYCLES + TIMING_CONSTANTS.DRAWING_CYCLES
    ) {
      newPPU = setMode(newPPU, PPU_MODES.DRAWING);
      newPPU = renderBGScanline(newPPU, newPPU.registers.LY);
    } else {
      newPPU = setMode(newPPU, PPU_MODES.HBLANK);
    }
  } else {
    newPPU = setMode(newPPU, PPU_MODES.VBLANK);
  }

  return newPPU;
};

export const advanceScanline = (ppu) => {
  const newPPU = { ...ppu };

  newPPU.scanlineCycles = 0;

  newPPU.registers = {
    ...newPPU.registers,
    LY: (newPPU.registers.LY + 1) % TIMING_CONSTANTS.TOTAL_LINES,
  };

  const lycEquals = newPPU.registers.LY === newPPU.registers.LYC;

  newPPU.registers = {
    ...newPPU.registers,
    STAT: lycEquals ? newPPU.registers.STAT | 0x04 : newPPU.registers.STAT & 0xfb,
  };

  return newPPU;
};

export const stepPPUTiming = (ppu, cpuCycles) => {
  let newPPU = { ...ppu };

  newPPU.cycles += cpuCycles;

  newPPU.scanlineCycles += cpuCycles;

  if (newPPU.scanlineCycles >= TIMING_CONSTANTS.SCANLINE_CYCLES) {
    newPPU = advanceScanline(newPPU);
  }

  newPPU = stepScanline(newPPU);

  return newPPU;
};
