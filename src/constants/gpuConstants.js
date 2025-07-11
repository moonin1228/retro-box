export const REG = {
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

export const OAM_START = 0xfe00;
export const OAM_END = 0xfe9f;

export const TILEMAP = Object.freeze({
  HEIGHT: 32,
  WIDTH: 32,
  START_0: 0x9800,
  START_1: 0x9c00,
  LENGTH: 0x0400,
});
