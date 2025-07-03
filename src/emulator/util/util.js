export const merge = (...objs) => objs.reduce((acc, obj) => Object.assign(acc, obj), {});

const makeWord = (hi, lo) => ((hi & 0xff) << 8) | (lo & 0xff);

const getSigned = (byte) => (byte & 0x80 ? byte - 0x100 : byte);
const getSignedValue = getSigned;

const readBit = (byte, index) => (byte >> index) & 1;

const testFlag = (cpu, cc) => {
  const z = readBit(cpu.r.F, 7);
  const c = readBit(cpu.r.F, 4);
  switch (cc) {
    case "NZ":
      return !z;
    case "Z":
      return z;
    case "NC":
      return !c;
    case "C":
      return c;
    default:
      throw new Error(`Unknown condition code "${cc}"`);
  }
};

const getRegAddr = (cpu, hi, lo) => makeWord(cpu.r[hi], cpu.r[lo]);

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
