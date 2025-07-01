import { ppuRegister } from "./ppuRegisters.js";

export const createPPU = () => ({
  registers: ppuRegister,

  mode: 2,
  cycles: 0,
  scanline: 0,
  scanlineCycles: 0,
  vram: new Uint8Array(0x2000),
  framebuffer: null,
});

export const readLCDC = (registers) => registers.LCDC;
export const writeLCDC = (registers, value) => ({ ...registers, LCDC: value });

export const readSTAT = (registers) => registers.STAT;
export const writeSTAT = (registers, value) => ({ ...registers, STAT: value });

export const setMode = (ppu, newMode) => ({
  ...ppu,
  mode: newMode,
  registers: {
    ...ppu.registers,
    STAT: (ppu.registers.STAT & 0xfc) | newMode,
  },
});
export const isMode = (ppu, mode) => ppu.mode === mode;
