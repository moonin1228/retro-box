export const INITIAL_REGISTER = {
  A: 0x01,
  F: 0x00,
  B: 0xff,
  C: 0x13,
  D: 0x00,
  E: 0xc1,
  H: 0x84,
  L: 0x03,
  pc: 0x0000,
  sp: 0xfffe,
};

export const INTERRUPTS = {
  VBLANK: 0,
  LCDC: 1,
  TIMER: 2,
  SERIAL: 3,
  HILO: 4,
};
