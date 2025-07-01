const createPPU = () => ({
  LCDC: 0x91,
  STAT: 0x85,
  LY: 0x00,
  LYC: 0x00,
  SCX: 0x00,
  SCY: 0x00,
});

export const ppuRegister = createPPU();
