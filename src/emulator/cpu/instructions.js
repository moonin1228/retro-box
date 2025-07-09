import { opcodeCbmap } from "@/emulator/cpu/opcodes.js";
import Util from "@/emulator/util/util.js";

const ops = {
  LDrrnn(p, r1, r2) {
    p.setRegister(r2, p.memory.readByte(p.register.pc));
    p.setRegister(r1, p.memory.readByte(p.register.pc + 1));
    p.register.pc += 2;
    p.clock.c += 12;
  },
  LDrrar(p, r1, r2, r3) {
    ops._LDav(p, Util.getRegAddr(p, r1, r2), p.register[r3]);
    p.clock.c += 8;
  },
  LDrrra(p, r1, r2, r3) {
    p.setRegister(r1, p.memory.readByte(Util.getRegAddr(p, r2, r3)));
    p.clock.c += 8;
  },
  LDrn(p, r1) {
    p.setRegister(r1, p.memory.readByte(p.register.pc++));
    p.clock.c += 8;
  },
  LDrr(p, r1, r2) {
    p.setRegister(r1, p.register[r2]);
    p.clock.c += 4;
  },
  LDrar(p, r1, r2) {
    p.memory.writeByte(p.register[r1] + 0xff00, p.register[r2]);
    p.clock.c += 8;
  },
  LDrra(p, r1, r2) {
    p.setRegister(r1, p.memory.readByte(p.register[r2] + 0xff00));
    p.clock.c += 8;
  },
  LDspnn(p) {
    p.setRegister(
      "sp",
      (p.memory.readByte(p.register.pc + 1) << 8) + p.memory.readByte(p.register.pc),
    );
    p.register.pc += 2;
    p.clock.c += 12;
  },
  LDsprr(p, r1, r2) {
    p.setRegister("sp", Util.getRegAddr(p, r1, r2));
    p.clock.c += 8;
  },
  LDnnar(p, r1) {
    const addr = (p.memory.readByte(p.register.pc + 1) << 8) + p.memory.readByte(p.register.pc);
    p.memory.writeByte(addr, p.register[r1]);
    p.register.pc += 2;
    p.clock.c += 16;
  },
  LDrnna(p, r1) {
    const addr = (p.memory.readByte(p.register.pc + 1) << 8) + p.memory.readByte(p.register.pc);
    p.setRegister(r1, p.memory.readByte(addr));
    p.register.pc += 2;
    p.clock.c += 16;
  },
  LDrrspn(p, r1, r2) {
    let rel = p.memory.readByte(p.register.pc++);
    rel = Util.getSignedValue(rel);
    let val = p.register.sp + rel;
    const c = (p.register.sp & 0xff) + (rel & 0xff) > 0xff;
    const h = (p.register.sp & 0xf) + (rel & 0xf) > 0xf;
    val &= 0xffff;
    let f = 0;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
    p.setRegister(r1, val >> 8);
    p.setRegister(r2, val & 0xff);
    p.clock.c += 12;
  },
  LDnnsp(p) {
    const addr = p.memory.readByte(p.register.pc++) + (p.memory.readByte(p.register.pc++) << 8);
    ops._LDav(p, addr, p.register.sp & 0xff);
    ops._LDav(p, addr + 1, p.register.sp >> 8);
    p.clock.c += 20;
  },
  LDrran(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    ops._LDav(p, addr, p.memory.readByte(p.register.pc++));
    p.clock.c += 12;
  },
  _LDav(p, addr, val) {
    p.memory.writeByte(addr, val);
  },
  LDHnar(p, r1) {
    p.memory.writeByte(0xff00 + p.memory.readByte(p.register.pc++), p.register[r1]);
    p.clock.c += 12;
  },
  LDHrna(p, r1) {
    p.setRegister(r1, p.memory.readByte(0xff00 + p.memory.readByte(p.register.pc++)));
    p.clock.c += 12;
  },
  INCrr(p, r1, r2) {
    p.setRegister(r2, (p.register[r2] + 1) & 0xff);
    if (p.register[r2] === 0) p.setRegister(r1, (p.register[r1] + 1) & 0xff);
    p.clock.c += 8;
  },
  INCrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const val = (p.memory.readByte(addr) + 1) & 0xff;
    const z = val === 0;
    const h = (p.memory.readByte(addr) & 0xf) + 1 > 0xf;
    p.memory.writeByte(addr, val);
    p.register.F &= 0x10;
    if (h) p.register.F |= 0x20;
    if (z) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  INCsp(p) {
    p.setRegister("sp", p.register.sp + 1);
    p.register.sp &= 0xffff;
    p.clock.c += 8;
  },
  INCr(p, r1) {
    const h = ((p.register[r1] & 0xf) + 1) & 0x10;
    p.setRegister(r1, (p.register[r1] + 1) & 0xff);
    const z = p.register[r1] === 0;
    p.register.F &= 0x10;
    if (h) p.register.F |= 0x20;
    if (z) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  DECrr(p, r1, r2) {
    p.setRegister(r2, (p.register[r2] - 1) & 0xff);
    if (p.register[r2] === 0xff) p.setRegister(r1, (p.register[r1] - 1) & 0xff);
    p.clock.c += 8;
  },
  DECsp(p) {
    p.setRegister("sp", p.register.sp - 1);
    p.register.sp &= 0xffff;
    p.clock.c += 8;
  },
  DECr(p, r1) {
    const h = (p.register[r1] & 0xf) < 1;
    p.setRegister(r1, (p.register[r1] - 1) & 0xff);
    const z = p.register[r1] === 0;
    p.register.F &= 0x10;
    p.register.F |= 0x40;
    if (h) p.register.F |= 0x20;
    if (z) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  DECrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const val = (p.memory.readByte(addr) - 1) & 0xff;
    const z = val === 0;
    const h = (p.memory.readByte(addr) & 0xf) < 1;
    p.memory.writeByte(addr, val);
    p.register.F &= 0x10;
    p.register.F |= 0x40;
    if (h) p.register.F |= 0x20;
    if (z) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  ADDrr(p, r1, r2) {
    const n = p.register[r2];
    ops._ADDrn(p, r1, n);
    p.clock.c += 4;
  },
  ADDrn(p, r1) {
    const n = p.memory.readByte(p.register.pc++);
    ops._ADDrn(p, r1, n);
    p.clock.c += 8;
  },
  _ADDrn(p, r1, n) {
    const h = (p.register[r1] & 0xf) + (n & 0xf) > 0xf;
    const result = p.register[r1] + n;
    const c = result > 0xff;
    p.setRegister(r1, result & 0xff);
    let f = 0;
    if (p.register[r1] === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
  },
  ADDrrrr(p, r1, r2, r3, r4) {
    ops._ADDrrn(p, r1, r2, (p.register[r3] << 8) + p.register[r4]);
    p.clock.c += 8;
  },
  ADDrrsp(p, r1, r2) {
    ops._ADDrrn(p, r1, r2, p.register.sp);
    p.clock.c += 8;
  },
  ADDspn(p) {
    let v = p.memory.readByte(p.register.pc++);
    v = Util.getSignedValue(v);
    const c = (p.register.sp & 0xff) + (v & 0xff) > 0xff;
    const h = (p.register.sp & 0xf) + (v & 0xf) > 0xf;
    let f = 0;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
    p.setRegister("sp", (p.register.sp + v) & 0xffff);
    p.clock.c += 16;
  },
  _ADDrrn(p, r1, r2, n) {
    const v1 = (p.register[r1] << 8) + p.register[r2];
    const v2 = n;
    let res = v1 + v2;
    const c = res & 0x10000;
    const h = ((v1 & 0xfff) + (v2 & 0xfff)) & 0x1000;
    const z = p.register.F & 0x80;
    res &= 0xffff;
    p.register[r2] = res & 0xff;
    res >>= 8;
    p.register[r1] = res & 0xff;
    let f = 0;
    if (z) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.register.F = f;
  },
  ADCrr(p, r1, r2) {
    const n = p.register[r2];
    ops._ADCrn(p, r1, n);
    p.clock.c += 4;
  },
  ADCrn(p, r1) {
    const n = p.memory.readByte(p.register.pc++);
    ops._ADCrn(p, r1, n);
    p.clock.c += 8;
  },
  _ADCrn(p, r1, n) {
    const prevCarry = p.register.F & 0x10 ? 1 : 0;
    const result = p.register[r1] + n + prevCarry;
    const h = (p.register[r1] & 0xf) + (n & 0xf) + prevCarry > 0xf;
    const c = result > 0xff;
    p.setRegister(r1, result & 0xff);
    let f = 0;
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
  },
  ADCrrra(p, r1, r2, r3) {
    const n = p.memory.readByte(Util.getRegAddr(p, r2, r3));
    ops._ADCrn(p, r1, n);
    p.clock.c += 8;
  },
  ADDrrra(p, r1, r2, r3) {
    const v = p.memory.readByte(Util.getRegAddr(p, r2, r3));
    const result = p.register[r1] + v;
    const h = (p.register[r1] & 0xf) + (v & 0xf) > 0xf;
    const c = result > 0xff;
    p.setRegister(r1, result & 0xff);
    let f = 0;
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
    p.clock.c += 8;
  },
  SUBr(p, r1) {
    const n = p.register[r1];
    ops._SUBn(p, n);
    p.clock.c += 4;
  },
  SUBn(p) {
    const n = p.memory.readByte(p.register.pc++);
    ops._SUBn(p, n);
    p.clock.c += 8;
  },
  SUBrra(p, r1, r2) {
    const n = p.memory.readByte(Util.getRegAddr(p, r1, r2));
    ops._SUBn(p, n);
    p.clock.c += 8;
  },
  _SUBn(p, n) {
    const result = p.register.A - n;
    const h = (p.register.A & 0xf) < (n & 0xf);
    const c = result < 0;
    p.setRegister("A", result & 0xff);
    let f = 0x40;
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
  },
  SBCn(p) {
    const n = p.memory.readByte(p.register.pc++);
    ops._SBCn(p, n);
    p.clock.c += 8;
  },
  SBCr(p, r1) {
    const n = p.register[r1];
    ops._SBCn(p, n);
    p.clock.c += 4;
  },
  SBCrra(p, r1, r2) {
    const n = p.memory.readByte(Util.getRegAddr(p, r1, r2));
    ops._SBCn(p, n);
    p.clock.c += 8;
  },
  _SBCn(p, n) {
    const prevCarry = p.register.F & 0x10 ? 1 : 0;
    const result = p.register.A - n - prevCarry;
    const h = (p.register.A & 0xf) < (n & 0xf) + prevCarry;
    const c = result < 0;
    p.setRegister("A", result & 0xff);
    let f = 0x40;
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.setRegister("F", f);
  },
  ORr(p, r1) {
    p.register.A |= p.register[r1];
    p.register.F = p.register.A === 0 ? 0x80 : 0x00;
    p.clock.c += 4;
  },
  ORn(p) {
    p.register.A |= p.memory.readByte(p.register.pc++);
    p.register.F = p.register.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  ORrra(p, r1, r2) {
    p.register.A |= p.memory.readByte(Util.getRegAddr(p, r1, r2));
    p.register.F = p.register.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  ANDr(p, r1) {
    p.register.A &= p.register[r1];
    p.register.F = p.register.A === 0 ? 0xa0 : 0x20;
    p.clock.c += 4;
  },
  ANDn(p) {
    p.register.A &= p.memory.readByte(p.register.pc++);
    p.register.F = p.register.A === 0 ? 0xa0 : 0x20;
    p.clock.c += 8;
  },
  ANDrra(p, r1, r2) {
    p.register.A &= p.memory.readByte(Util.getRegAddr(p, r1, r2));
    p.register.F = p.register.A === 0 ? 0xa0 : 0x20;
    p.clock.c += 8;
  },
  XORr(p, r1) {
    p.register.A ^= p.register[r1];
    p.register.F = p.register.A === 0 ? 0x80 : 0x00;
    p.clock.c += 4;
  },
  XORn(p) {
    p.register.A ^= p.memory.readByte(p.register.pc++);
    p.register.F = p.register.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  XORrra(p, r1, r2) {
    p.register.A ^= p.memory.readByte(Util.getRegAddr(p, r1, r2));
    p.register.F = p.register.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  CPr(p, r1) {
    const n = p.register[r1];
    ops._CPn(p, n);
    p.clock.c += 4;
  },
  CPn(p) {
    const n = p.memory.readByte(p.register.pc++);
    ops._CPn(p, n);
    p.clock.c += 8;
  },
  CPrra(p, r1, r2) {
    const n = p.memory.readByte(Util.getRegAddr(p, r1, r2));
    ops._CPn(p, n);
    p.clock.c += 8;
  },
  _CPn(p, n) {
    const c = p.register.A < n;
    const z = p.register.A === n;
    const h = (p.register.A & 0xf) < (n & 0xf);
    let f = 0x40;
    if (z) f += 0x80;
    if (h) f += 0x20;
    if (c) f += 0x10;
    p.register.F = f;
  },
  RRCr(p, r1) {
    p.register.F = 0;
    const out = p.register[r1] & 0x01;
    if (out) p.register.F |= 0x10;
    p.register[r1] = (p.register[r1] >> 1) | (out * 0x80);
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  RRCrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.register.F = 0;
    const out = p.memory.readByte(addr) & 0x01;
    if (out) p.register.F |= 0x10;
    p.memory.writeByte(addr, (p.memory.readByte(addr) >> 1) | (out * 0x80));
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  RLCr(p, r1) {
    p.register.F = 0;
    const out = p.register[r1] & 0x80 ? 1 : 0;
    if (out) p.register.F |= 0x10;
    p.register[r1] = ((p.register[r1] << 1) + out) & 0xff;
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  RLCrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.register.F = 0;
    const out = p.memory.readByte(addr) & 0x80 ? 1 : 0;
    if (out) p.register.F |= 0x10;
    p.memory.writeByte(addr, ((p.memory.readByte(addr) << 1) + out) & 0xff);
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  RLr(p, r1) {
    const c = p.register.F & 0x10 ? 1 : 0;
    p.register.F = 0;
    const out = p.register[r1] & 0x80;
    out ? (p.register.F |= 0x10) : (p.register.F &= 0xef);
    p.register[r1] = ((p.register[r1] << 1) + c) & 0xff;
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  RLrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const c = p.register.F & 0x10 ? 1 : 0;
    p.register.F = 0;
    const out = p.memory.readByte(addr) & 0x80;
    out ? (p.register.F |= 0x10) : (p.register.F &= 0xef);
    p.memory.writeByte(addr, ((p.memory.readByte(addr) << 1) + c) & 0xff);
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  RRr(p, r1) {
    const c = p.register.F & 0x10 ? 1 : 0;
    p.register.F = 0;
    const out = p.register[r1] & 0x01;
    out ? (p.register.F |= 0x10) : (p.register.F &= 0xef);
    p.register[r1] = (p.register[r1] >> 1) | (c * 0x80);
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  RRrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const c = p.register.F & 0x10 ? 1 : 0;
    p.register.F = 0;
    const out = p.memory.readByte(addr) & 0x01;
    out ? (p.register.F |= 0x10) : (p.register.F &= 0xef);
    p.memory.writeByte(addr, (p.memory.readByte(addr) >> 1) | (c * 0x80));
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  SRAr(p, r1) {
    p.register.F = 0;
    if (p.register[r1] & 0x01) p.register.F |= 0x10;
    const msb = p.register[r1] & 0x80;
    p.register[r1] = (p.register[r1] >> 1) | msb;
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  SRArra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.register.F = 0;
    if (p.memory.readByte(addr) & 0x01) p.register.F |= 0x10;
    const msb = p.memory.readByte(addr) & 0x80;
    p.memory.writeByte(addr, (p.memory.readByte(addr) >> 1) | msb);
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  SLAr(p, r1) {
    p.register.F = 0;
    if (p.register[r1] & 0x80) p.register.F |= 0x10;
    p.register[r1] = (p.register[r1] << 1) & 0xff;
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  SLArra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.register.F = 0;
    if (p.memory.readByte(addr) & 0x80) p.register.F |= 0x10;
    p.memory.writeByte(addr, (p.memory.readByte(addr) << 1) & 0xff);
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  SRLr(p, r1) {
    p.register.F = 0;
    if (p.register[r1] & 0x01) p.register.F |= 0x10;
    p.register[r1] = p.register[r1] >> 1;
    if (p.register[r1] === 0) p.register.F |= 0x80;
    p.clock.c += 4;
  },
  SRLrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.register.F = 0;
    if (p.memory.readByte(addr) & 0x01) p.register.F |= 0x10;
    p.memory.writeByte(addr, p.memory.readByte(addr) >> 1);
    if (p.memory.readByte(addr) === 0) p.register.F |= 0x80;
    p.clock.c += 12;
  },
  BITir(p, i, r1) {
    const mask = 1 << i;
    const z = p.register[r1] & mask ? 0 : 1;
    let f = p.register.F & 0x10;
    f |= 0x20;
    if (z) f |= 0x80;
    p.register.F = f;
    p.clock.c += 4;
  },
  BITirra(p, i, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const mask = 1 << i;
    const z = p.memory.readByte(addr) & mask ? 0 : 1;
    let f = p.register.F & 0x10;
    f |= 0x20;
    if (z) f |= 0x80;
    p.register.F = f;
    p.clock.c += 8;
  },
  SETir(p, i, r1) {
    const mask = 1 << i;
    p.register[r1] |= mask;
    p.clock.c += 4;
  },
  SETirra(p, i, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const mask = 1 << i;
    p.memory.writeByte(addr, p.memory.readByte(addr) | mask);
    p.clock.c += 12;
  },
  RESir(p, i, r1) {
    const mask = 0xff - (1 << i);
    p.register[r1] &= mask;
    p.clock.c += 4;
  },
  RESirra(p, i, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const mask = 0xff - (1 << i);
    p.memory.writeByte(addr, p.memory.readByte(addr) & mask);
    p.clock.c += 12;
  },
  SWAPr(p, r1) {
    p.register[r1] = ops._SWAPn(p, p.register[r1]);
    p.clock.c += 4;
  },
  SWAPrra(p, r1, r2) {
    const addr = (p.register[r1] << 8) + p.register[r2];
    p.memory.writeByte(addr, ops._SWAPn(p, p.memory.readByte(addr)));
    p.clock.c += 12;
  },
  _SWAPn(p, n) {
    p.register.F = n === 0 ? 0x80 : 0;
    return ((n & 0xf0) >> 4) | ((n & 0x0f) << 4);
  },
  JPnn(p) {
    p.setRegister(
      "pc",
      (p.memory.readByte(p.register.pc + 1) << 8) + p.memory.readByte(p.register.pc),
    );
    p.clock.c += 16;
  },
  JRccn(p, cc) {
    if (Util.testFlag(p, cc)) {
      let v = p.memory.readByte(p.register.pc++);
      v = Util.getSignedValue(v);
      p.register.pc += v;
      p.clock.c += 4;
    } else {
      p.register.pc++;
    }
    p.clock.c += 8;
  },
  JPccnn(p, cc) {
    if (Util.testFlag(p, cc)) {
      p.setRegister(
        "pc",
        (p.memory.readByte(p.register.pc + 1) << 8) + p.memory.readByte(p.register.pc),
      );
      p.clock.c += 4;
    } else {
      p.register.pc += 2;
    }
    p.clock.c += 12;
  },
  JPrr(p, r1, r2) {
    p.register.pc = (p.register[r1] << 8) + p.register[r2];
    p.clock.c += 4;
  },
  JRn(p) {
    let v = p.memory.readByte(p.register.pc++);
    v = Util.getSignedValue(v);
    p.register.pc += v;
    p.clock.c += 12;
  },
  PUSHrr(p, r1, r2) {
    p.setRegister("sp", p.register.sp - 1);
    p.memory.writeByte(p.register.sp, p.register[r1]);
    p.setRegister("sp", p.register.sp - 1);
    p.memory.writeByte(p.register.sp, p.register[r2]);
    p.clock.c += 16;
  },
  POPrr(p, r1, r2) {
    p.setRegister(r2, p.memory.readByte(p.register.sp));
    p.setRegister("sp", p.register.sp + 1);
    p.setRegister(r1, p.memory.readByte(p.register.sp));
    p.setRegister("sp", p.register.sp + 1);
    p.clock.c += 12;
  },
  RSTn(p, n) {
    p.setRegister("sp", p.register.sp - 1);
    p.memory.writeByte(p.register.sp, p.register.pc >> 8);
    p.setRegister("sp", p.register.sp - 1);
    p.memory.writeByte(p.register.sp, p.register.pc & 0xff);
    p.register.pc = n;
    p.clock.c += 16;
  },
  RET(p) {
    p.register.pc = p.memory.readByte(p.register.sp);
    p.setRegister("sp", p.register.sp + 1);
    p.register.pc += p.memory.readByte(p.register.sp) << 8;
    p.setRegister("sp", p.register.sp + 1);
    p.clock.c += 16;
  },
  RETcc(p, cc) {
    if (Util.testFlag(p, cc)) {
      p.register.pc = p.memory.readByte(p.register.sp);
      p.setRegister("sp", p.register.sp + 1);
      p.register.pc += p.memory.readByte(p.register.sp) << 8;
      p.setRegister("sp", p.register.sp + 1);
      p.clock.c += 12;
    }
    p.clock.c += 8;
  },
  CALLnn(p) {
    ops._CALLnn(p);
    p.clock.c += 24;
  },
  CALLccnn(p, cc) {
    if (Util.testFlag(p, cc)) {
      ops._CALLnn(p);
      p.clock.c += 12;
    } else {
      p.register.pc += 2;
    }
    p.clock.c += 12;
  },
  _CALLnn(p) {
    p.setRegister("sp", p.register.sp - 1);
    p.memory.writeByte(p.register.sp, ((p.register.pc + 2) & 0xff00) >> 8);
    p.setRegister("sp", p.register.sp - 1);
    p.memory.writeByte(p.register.sp, (p.register.pc + 2) & 0x00ff);
    const j = p.memory.readByte(p.register.pc) + (p.memory.readByte(p.register.pc + 1) << 8);
    p.register.pc = j;
  },
  CPL(p) {
    p.setRegister("A", ~p.register.A & 0xff);
    ((p.register.F |= 0x60), (p.clock.c += 4));
  },
  CCF(p) {
    p.register.F &= 0x9f;
    p.register.F & 0x10 ? (p.register.F &= 0xe0) : (p.register.F |= 0x10);
    p.clock.c += 4;
  },
  SCF(p) {
    p.register.F &= 0x9f;
    p.register.F |= 0x10;
    p.clock.c += 4;
  },
  DAA(p) {
    const sub = p.register.F & 0x40 ? 1 : 0;
    const h = p.register.F & 0x20 ? 1 : 0;
    let c = p.register.F & 0x10 ? 1 : 0;
    if (sub) {
      if (h) {
        p.register.A = (p.register.A - 0x6) & 0xff;
      }
      if (c) {
        p.register.A -= 0x60;
      }
    } else {
      if ((p.register.A & 0xf) > 9 || h) {
        p.register.A += 0x6;
      }
      if (p.register.A > 0x9f || c) {
        p.register.A += 0x60;
      }
    }
    if (p.register.A & 0x100) c = 1;

    p.register.A &= 0xff;
    p.register.F &= 0x40;
    if (p.register.A === 0) p.register.F |= 0x80;
    if (c) p.register.F |= 0x10;
    p.clock.c += 4;
  },
  HALT(p) {
    p.halt();
    p.clock.c += 4;
  },
  DI(p) {
    p.disableInterrupts();
    p.clock.c += 4;
  },
  EI(p) {
    p.scheduleInterruptEnable();
    p.clock.c += 4;
  },
  RETI(p) {
    ops.RET(p);
    p.enableInterrupts();
  },
  CB(p) {
    const opcode = p.memory.readByte(p.register.pc++);
    opcodeCbmap[opcode](p);
    p.clock.c += 4;
  },
};

export { ops as cpuOps };
