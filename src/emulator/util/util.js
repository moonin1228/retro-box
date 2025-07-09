export const merge = (...objs) => objs.reduce((acc, obj) => Object.assign(acc, obj), {});

const makeWord = (hi, lo) => ((hi & 0xff) << 8) | (lo & 0xff);

const getSigned = (byte) => (byte & 0x80 ? byte - 0x100 : byte);
const getSignedValue = getSigned;

const readBit = (byte, index) => (byte >> index) & 1;

const testFlag = (p, cc) => {
  switch (cc) {
    case "NZ":
      return !(p.register.F & 0x80);
    case "Z":
      return p.register.F & 0x80;
    case "NC":
      return !(p.register.F & 0x10);
    case "C":
      return p.register.F & 0x10;
    default:
      return false;
  }
};

const getRegAddr = (p, r1, r2) => (p.register[r1] << 8) + p.register[r2];

const Util = Object.freeze({
  merge,
  testFlag,
  getRegAddr,
  makeWord,
  getSigned,
  getSignedValue,
  readBit,
});

export default Util;
