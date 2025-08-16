export const merge = <T extends object[]>(...objs: T): UnionToIntersection<T[number]> => {
  return objs.reduce((acc, obj) => Object.assign(acc, obj), {}) as UnionToIntersection<T[number]>;
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

export function makeWord(hi: number, lo: number): number {
  return ((hi & 0xff) << 8) | (lo & 0xff);
}

export function getSigned(byte: number): number {
  return byte & 0x80 ? byte - 0x100 : byte;
}

export const getSignedValue = getSigned;

export function readBit(byte: number, index: number): number {
  return (byte >> index) & 1;
}

export function testFlag(p: any, cc: "NZ" | "Z" | "NC" | "C"): boolean {
  switch (cc) {
    case "NZ":
      return !(p.register.F & 0x80);
    case "Z":
      return !!(p.register.F & 0x80);
    case "NC":
      return !(p.register.F & 0x10);
    case "C":
      return !!(p.register.F & 0x10);
    default:
      return false;
  }
}

export function getRegAddr(p: any, r1: string, r2: string): number {
  return (p.register[r1] << 8) + p.register[r2];
}

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



