import { opcodeCbmap } from "@/emulator/cpu/opcodes.js";
import Util from "@/emulator/util/util.js";

const ops = {
  LDrrnn(p, r1, r2) {
    p.wr(r2, p.memory.rb(p.r.pc));
    p.wr(r1, p.memory.rb(p.r.pc + 1));
    p.r.pc += 2;
    p.clock.c += 12;
  },
  LDrrar(p, r1, r2, r3) {
    ops._LDav(p, Util.getRegAddr(p, r1, r2), p.r[r3]);
    p.clock.c += 8;
  },
  LDrrra(p, r1, r2, r3) {
    p.wr(r1, p.memory.rb(Util.getRegAddr(p, r2, r3)));
    p.clock.c += 8;
  },
  LDrn(p, r1) {
    p.wr(r1, p.memory.rb(p.r.pc++));
    p.clock.c += 8;
  },
  LDrr(p, r1, r2) {
    p.wr(r1, p.r[r2]);
    p.clock.c += 4;
  },
  LDrar(p, r1, r2) {
    p.memory.wb(p.r[r1] + 0xff00, p.r[r2]);
    p.clock.c += 8;
  },
  LDrra(p, r1, r2) {
    p.wr(r1, p.memory.rb(p.r[r2] + 0xff00));
    p.clock.c += 8;
  },
  LDspnn(p) {
    p.wr("sp", (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc));
    p.r.pc += 2;
    p.clock.c += 12;
  },
  LDsprr(p, r1, r2) {
    p.wr("sp", Util.getRegAddr(p, r1, r2));
    p.clock.c += 8;
  },
  LDnnar(p, r1) {
    const addr = (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc);
    p.memory.wb(addr, p.r[r1]);
    p.r.pc += 2;
    p.clock.c += 16;
  },
  LDrnna(p, r1) {
    const addr = (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc);
    p.wr(r1, p.memory.rb(addr));
    p.r.pc += 2;
    p.clock.c += 16;
  },
  LDrrspn(p, r1, r2) {
    let rel = p.memory.rb(p.r.pc++);
    rel = Util.getSignedValue(rel);
    let val = p.r.sp + rel;
    const c = (p.r.sp & 0xff) + (rel & 0xff) > 0xff;
    const h = (p.r.sp & 0xf) + (rel & 0xf) > 0xf;
    val &= 0xffff;
    let f = 0;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
    p.wr(r1, val >> 8);
    p.wr(r2, val & 0xff);
    p.clock.c += 12;
  },
  LDnnsp(p) {
    const addr = p.memory.rb(p.r.pc++) + (p.memory.rb(p.r.pc++) << 8);
    ops._LDav(p, addr, p.r.sp & 0xff);
    ops._LDav(p, addr + 1, p.r.sp >> 8);
    p.clock.c += 20;
  },
  LDrran(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    ops._LDav(p, addr, p.memory.rb(p.r.pc++));
    p.clock.c += 12;
  },
  _LDav(p, addr, val) {
    p.memory.wb(addr, val);
  },
  LDHnar(p, r1) {
    p.memory.wb(0xff00 + p.memory.rb(p.r.pc++), p.r[r1]);
    p.clock.c += 12;
  },
  LDHrna(p, r1) {
    p.wr(r1, p.memory.rb(0xff00 + p.memory.rb(p.r.pc++)));
    p.clock.c += 12;
  },
  INCrr(p, r1, r2) {
    p.wr(r2, (p.r[r2] + 1) & 0xff);
    if (p.r[r2] === 0) p.wr(r1, (p.r[r1] + 1) & 0xff);
    p.clock.c += 8;
  },
  INCrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const val = (p.memory.rb(addr) + 1) & 0xff;
    const z = val === 0;
    const h = (p.memory.rb(addr) & 0xf) + 1 > 0xf;
    p.memory.wb(addr, val);
    p.r.F &= 0x10;
    if (h) p.r.F |= 0x20;
    if (z) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  INCsp(p) {
    p.wr("sp", p.r.sp + 1);
    p.r.sp &= 0xffff;
    p.clock.c += 8;
  },
  INCr(p, r1) {
    const h = ((p.r[r1] & 0xf) + 1) & 0x10;
    p.wr(r1, (p.r[r1] + 1) & 0xff);
    const z = p.r[r1] === 0;
    p.r.F &= 0x10;
    if (h) p.r.F |= 0x20;
    if (z) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  DECrr(p, r1, r2) {
    p.wr(r2, (p.r[r2] - 1) & 0xff);
    if (p.r[r2] === 0xff) p.wr(r1, (p.r[r1] - 1) & 0xff);
    p.clock.c += 8;
  },
  DECsp(p) {
    p.wr("sp", p.r.sp - 1);
    p.r.sp &= 0xffff;
    p.clock.c += 8;
  },
  DECr(p, r1) {
    const h = (p.r[r1] & 0xf) < 1;
    p.wr(r1, (p.r[r1] - 1) & 0xff);
    const z = p.r[r1] === 0;
    p.r.F &= 0x10;
    p.r.F |= 0x40;
    if (h) p.r.F |= 0x20;
    if (z) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  DECrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const val = (p.memory.rb(addr) - 1) & 0xff;
    const z = val === 0;
    const h = (p.memory.rb(addr) & 0xf) < 1;
    p.memory.wb(addr, val);
    p.r.F &= 0x10;
    p.r.F |= 0x40;
    if (h) p.r.F |= 0x20;
    if (z) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  ADDrr(p, r1, r2) {
    const n = p.r[r2];
    ops._ADDrn(p, r1, n);
    p.clock.c += 4;
  },
  ADDrn(p, r1) {
    const n = p.memory.rb(p.r.pc++);
    ops._ADDrn(p, r1, n);
    p.clock.c += 8;
  },
  _ADDrn(p, r1, n) {
    const h = (p.r[r1] & 0xf) + (n & 0xf) > 0xf;
    const result = p.r[r1] + n;
    const c = result > 0xff;
    p.wr(r1, result & 0xff);
    let f = 0;
    if (p.r[r1] === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
  },
  ADDrrrr(p, r1, r2, r3, r4) {
    ops._ADDrrn(p, r1, r2, (p.r[r3] << 8) + p.r[r4]);
    p.clock.c += 8;
  },
  ADDrrsp(p, r1, r2) {
    ops._ADDrrn(p, r1, r2, p.r.sp);
    p.clock.c += 8;
  },
  ADDspn(p) {
    let v = p.memory.rb(p.r.pc++);
    v = Util.getSignedValue(v);
    const c = (p.r.sp & 0xff) + (v & 0xff) > 0xff;
    const h = (p.r.sp & 0xf) + (v & 0xf) > 0xf;
    let f = 0;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
    p.wr("sp", (p.r.sp + v) & 0xffff);
    p.clock.c += 16;
  },
  _ADDrrn(p, r1, r2, n) {
    const v1 = (p.r[r1] << 8) + p.r[r2];
    const v2 = n;
    let res = v1 + v2;
    const c = res & 0x10000;
    const h = ((v1 & 0xfff) + (v2 & 0xfff)) & 0x1000;
    const z = p.r.F & 0x80;
    res &= 0xffff;
    p.r[r2] = res & 0xff;
    res >>= 8;
    p.r[r1] = res & 0xff;
    let f = 0;
    if (z) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.r.F = f;
  },
  ADCrr(p, r1, r2) {
    const n = p.r[r2];
    ops._ADCrn(p, r1, n);
    p.clock.c += 4;
  },
  ADCrn(p, r1) {
    const n = p.memory.rb(p.r.pc++);
    ops._ADCrn(p, r1, n);
    p.clock.c += 8;
  },
  _ADCrn(p, r1, n) {
    const prevCarry = p.r.F & 0x10 ? 1 : 0;
    const result = p.r[r1] + n + prevCarry;
    const h = (p.r[r1] & 0xf) + (n & 0xf) + prevCarry > 0xf;
    const c = result > 0xff;
    p.wr(r1, result & 0xff);
    let f = 0;
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
  },
  ADCrrra(p, r1, r2, r3) {
    const n = p.memory.rb(Util.getRegAddr(p, r2, r3));
    ops._ADCrn(p, r1, n);
    p.clock.c += 8;
  },
  ADDrrra(p, r1, r2, r3) {
    const v = p.memory.rb(Util.getRegAddr(p, r2, r3));
    const result = p.r[r1] + v;
    const h = (p.r[r1] & 0xf) + (v & 0xf) > 0xf;
    const c = result > 0xff;
    p.wr(r1, result & 0xff);
    let f = 0;
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
    p.clock.c += 8;
  },
  SUBr(p, r1) {
    const n = p.r[r1];
    ops._SUBn(p, n);
    p.clock.c += 4;
  },
  SUBn(p) {
    const n = p.memory.rb(p.r.pc++);
    ops._SUBn(p, n);
    p.clock.c += 8;
  },
  SUBrra(p, r1, r2) {
    const n = p.memory.rb(Util.getRegAddr(p, r1, r2));
    ops._SUBn(p, n);
    p.clock.c += 8;
  },
  _SUBn(p, n) {
    const result = p.r.A - n;
    const h = (p.r.A & 0xf) < (n & 0xf);
    const c = result < 0;
    p.wr("A", result & 0xff);
    let f = 0x40; // N flag is always set
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
  },
  SBCn(p) {
    const n = p.memory.rb(p.r.pc++);
    ops._SBCn(p, n);
    p.clock.c += 8;
  },
  SBCr(p, r1) {
    const n = p.r[r1];
    ops._SBCn(p, n);
    p.clock.c += 4;
  },
  SBCrra(p, r1, r2) {
    const n = p.memory.rb(Util.getRegAddr(p, r1, r2));
    ops._SBCn(p, n);
    p.clock.c += 8;
  },
  _SBCn(p, n) {
    const prevCarry = p.r.F & 0x10 ? 1 : 0;
    const result = p.r.A - n - prevCarry;
    const h = (p.r.A & 0xf) < (n & 0xf) + prevCarry;
    const c = result < 0;
    p.wr("A", result & 0xff);
    let f = 0x40; // N flag is always set
    if ((result & 0xff) === 0) f |= 0x80;
    if (h) f |= 0x20;
    if (c) f |= 0x10;
    p.wr("F", f);
  },
  ORr(p, r1) {
    p.r.A |= p.r[r1];
    p.r.F = p.r.A === 0 ? 0x80 : 0x00;
    p.clock.c += 4;
  },
  ORn(p) {
    p.r.A |= p.memory.rb(p.r.pc++);
    p.r.F = p.r.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  ORrra(p, r1, r2) {
    p.r.A |= p.memory.rb(Util.getRegAddr(p, r1, r2));
    p.r.F = p.r.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  ANDr(p, r1) {
    p.r.A &= p.r[r1];
    p.r.F = p.r.A === 0 ? 0xa0 : 0x20;
    p.clock.c += 4;
  },
  ANDn(p) {
    p.r.A &= p.memory.rb(p.r.pc++);
    p.r.F = p.r.A === 0 ? 0xa0 : 0x20;
    p.clock.c += 8;
  },
  ANDrra(p, r1, r2) {
    p.r.A &= p.memory.rb(Util.getRegAddr(p, r1, r2));
    p.r.F = p.r.A === 0 ? 0xa0 : 0x20;
    p.clock.c += 8;
  },
  XORr(p, r1) {
    p.r.A ^= p.r[r1];
    p.r.F = p.r.A === 0 ? 0x80 : 0x00;
    p.clock.c += 4;
  },
  XORn(p) {
    p.r.A ^= p.memory.rb(p.r.pc++);
    p.r.F = p.r.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  XORrra(p, r1, r2) {
    p.r.A ^= p.memory.rb(Util.getRegAddr(p, r1, r2));
    p.r.F = p.r.A === 0 ? 0x80 : 0x00;
    p.clock.c += 8;
  },
  CPr(p, r1) {
    const n = p.r[r1];
    ops._CPn(p, n);
    p.clock.c += 4;
  },
  CPn(p) {
    const n = p.memory.rb(p.r.pc++);
    ops._CPn(p, n);
    p.clock.c += 8;
  },
  CPrra(p, r1, r2) {
    const n = p.memory.rb(Util.getRegAddr(p, r1, r2));
    ops._CPn(p, n);
    p.clock.c += 8;
  },
  _CPn(p, n) {
    const c = p.r.A < n;
    const z = p.r.A === n;
    const h = (p.r.A & 0xf) < (n & 0xf);
    let f = 0x40;
    if (z) f += 0x80;
    if (h) f += 0x20;
    if (c) f += 0x10;
    p.r.F = f;
  },
  RRCr(p, r1) {
    p.r.F = 0;
    const out = p.r[r1] & 0x01;
    if (out) p.r.F |= 0x10;
    p.r[r1] = (p.r[r1] >> 1) | (out * 0x80);
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  RRCrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.r.F = 0;
    const out = p.memory.rb(addr) & 0x01;
    if (out) p.r.F |= 0x10;
    p.memory.wb(addr, (p.memory.rb(addr) >> 1) | (out * 0x80));
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  RLCr(p, r1) {
    p.r.F = 0;
    const out = p.r[r1] & 0x80 ? 1 : 0;
    if (out) p.r.F |= 0x10;
    p.r[r1] = ((p.r[r1] << 1) + out) & 0xff;
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  RLCrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.r.F = 0;
    const out = p.memory.rb(addr) & 0x80 ? 1 : 0;
    if (out) p.r.F |= 0x10;
    p.memory.wb(addr, ((p.memory.rb(addr) << 1) + out) & 0xff);
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  RLr(p, r1) {
    const c = p.r.F & 0x10 ? 1 : 0;
    p.r.F = 0;
    const out = p.r[r1] & 0x80;
    out ? (p.r.F |= 0x10) : (p.r.F &= 0xef);
    p.r[r1] = ((p.r[r1] << 1) + c) & 0xff;
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  RLrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const c = p.r.F & 0x10 ? 1 : 0;
    p.r.F = 0;
    const out = p.memory.rb(addr) & 0x80;
    out ? (p.r.F |= 0x10) : (p.r.F &= 0xef);
    p.memory.wb(addr, ((p.memory.rb(addr) << 1) + c) & 0xff);
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  RRr(p, r1) {
    const c = p.r.F & 0x10 ? 1 : 0;
    p.r.F = 0;
    const out = p.r[r1] & 0x01;
    out ? (p.r.F |= 0x10) : (p.r.F &= 0xef);
    p.r[r1] = (p.r[r1] >> 1) | (c * 0x80);
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  RRrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const c = p.r.F & 0x10 ? 1 : 0;
    p.r.F = 0;
    const out = p.memory.rb(addr) & 0x01;
    out ? (p.r.F |= 0x10) : (p.r.F &= 0xef);
    p.memory.wb(addr, (p.memory.rb(addr) >> 1) | (c * 0x80));
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  SRAr(p, r1) {
    p.r.F = 0;
    if (p.r[r1] & 0x01) p.r.F |= 0x10;
    const msb = p.r[r1] & 0x80;
    p.r[r1] = (p.r[r1] >> 1) | msb;
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  SRArra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.r.F = 0;
    if (p.memory.rb(addr) & 0x01) p.r.F |= 0x10;
    const msb = p.memory.rb(addr) & 0x80;
    p.memory.wb(addr, (p.memory.rb(addr) >> 1) | msb);
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  SLAr(p, r1) {
    p.r.F = 0;
    if (p.r[r1] & 0x80) p.r.F |= 0x10;
    p.r[r1] = (p.r[r1] << 1) & 0xff;
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  SLArra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.r.F = 0;
    if (p.memory.rb(addr) & 0x80) p.r.F |= 0x10;
    p.memory.wb(addr, (p.memory.rb(addr) << 1) & 0xff);
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  SRLr(p, r1) {
    p.r.F = 0;
    if (p.r[r1] & 0x01) p.r.F |= 0x10;
    p.r[r1] = p.r[r1] >> 1;
    if (p.r[r1] === 0) p.r.F |= 0x80;
    p.clock.c += 4;
  },
  SRLrra(p, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    p.r.F = 0;
    if (p.memory.rb(addr) & 0x01) p.r.F |= 0x10;
    p.memory.wb(addr, p.memory.rb(addr) >> 1);
    if (p.memory.rb(addr) === 0) p.r.F |= 0x80;
    p.clock.c += 12;
  },
  BITir(p, i, r1) {
    const mask = 1 << i;
    const z = p.r[r1] & mask ? 0 : 1;
    let f = p.r.F & 0x10;
    f |= 0x20;
    if (z) f |= 0x80;
    p.r.F = f;
    p.clock.c += 4;
  },
  BITirra(p, i, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const mask = 1 << i;
    const z = p.memory.rb(addr) & mask ? 0 : 1;
    let f = p.r.F & 0x10;
    f |= 0x20;
    if (z) f |= 0x80;
    p.r.F = f;
    p.clock.c += 8;
  },
  SETir(p, i, r1) {
    const mask = 1 << i;
    p.r[r1] |= mask;
    p.clock.c += 4;
  },
  SETirra(p, i, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const mask = 1 << i;
    p.memory.wb(addr, p.memory.rb(addr) | mask);
    p.clock.c += 12;
  },
  RESir(p, i, r1) {
    const mask = 0xff - (1 << i);
    p.r[r1] &= mask;
    p.clock.c += 4;
  },
  RESirra(p, i, r1, r2) {
    const addr = Util.getRegAddr(p, r1, r2);
    const mask = 0xff - (1 << i);
    p.memory.wb(addr, p.memory.rb(addr) & mask);
    p.clock.c += 12;
  },
  SWAPr(p, r1) {
    p.r[r1] = ops._SWAPn(p, p.r[r1]);
    p.clock.c += 4;
  },
  SWAPrra(p, r1, r2) {
    const addr = (p.r[r1] << 8) + p.r[r2];
    p.memory.wb(addr, ops._SWAPn(p, p.memory.rb(addr)));
    p.clock.c += 12;
  },
  _SWAPn(p, n) {
    p.r.F = n === 0 ? 0x80 : 0;
    return ((n & 0xf0) >> 4) | ((n & 0x0f) << 4);
  },
  JPnn(p) {
    p.wr("pc", (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc));
    p.clock.c += 16;
  },
  JRccn(p, cc) {
    if (Util.testFlag(p, cc)) {
      let v = p.memory.rb(p.r.pc++);
      v = Util.getSignedValue(v);
      p.r.pc += v;
      p.clock.c += 4;
    } else {
      p.r.pc++;
    }
    p.clock.c += 8;
  },
  JPccnn(p, cc) {
    if (Util.testFlag(p, cc)) {
      p.wr("pc", (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc));
      p.clock.c += 4;
    } else {
      p.r.pc += 2;
    }
    p.clock.c += 12;
  },
  JPrr(p, r1, r2) {
    p.r.pc = (p.r[r1] << 8) + p.r[r2];
    p.clock.c += 4;
  },
  JRn(p) {
    let v = p.memory.rb(p.r.pc++);
    v = Util.getSignedValue(v);
    p.r.pc += v;
    p.clock.c += 12;
  },
  PUSHrr(p, r1, r2) {
    p.wr("sp", p.r.sp - 1);
    p.memory.wb(p.r.sp, p.r[r1]);
    p.wr("sp", p.r.sp - 1);
    p.memory.wb(p.r.sp, p.r[r2]);
    p.clock.c += 16;
  },
  POPrr(p, r1, r2) {
    p.wr(r2, p.memory.rb(p.r.sp));
    p.wr("sp", p.r.sp + 1);
    p.wr(r1, p.memory.rb(p.r.sp));
    p.wr("sp", p.r.sp + 1);
    p.clock.c += 12;
  },
  RSTn(p, n) {
    p.wr("sp", p.r.sp - 1);
    p.memory.wb(p.r.sp, p.r.pc >> 8);
    p.wr("sp", p.r.sp - 1);
    p.memory.wb(p.r.sp, p.r.pc & 0xff);
    p.r.pc = n;
    p.clock.c += 16;
  },
  RET(p) {
    p.r.pc = p.memory.rb(p.r.sp);
    p.wr("sp", p.r.sp + 1);
    p.r.pc += p.memory.rb(p.r.sp) << 8;
    p.wr("sp", p.r.sp + 1);
    p.clock.c += 16;
  },
  RETcc(p, cc) {
    if (Util.testFlag(p, cc)) {
      p.r.pc = p.memory.rb(p.r.sp);
      p.wr("sp", p.r.sp + 1);
      p.r.pc += p.memory.rb(p.r.sp) << 8;
      p.wr("sp", p.r.sp + 1);
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
      p.r.pc += 2;
    }
    p.clock.c += 12;
  },
  _CALLnn(p) {
    p.wr("sp", p.r.sp - 1);
    p.memory.wb(p.r.sp, ((p.r.pc + 2) & 0xff00) >> 8);
    p.wr("sp", p.r.sp - 1);
    p.memory.wb(p.r.sp, (p.r.pc + 2) & 0x00ff);
    const j = p.memory.rb(p.r.pc) + (p.memory.rb(p.r.pc + 1) << 8);
    p.r.pc = j;
  },
  CPL(p) {
    p.wr("A", ~p.r.A & 0xff);
    ((p.r.F |= 0x60), (p.clock.c += 4));
  },
  CCF(p) {
    p.r.F &= 0x9f;
    p.r.F & 0x10 ? (p.r.F &= 0xe0) : (p.r.F |= 0x10);
    p.clock.c += 4;
  },
  SCF(p) {
    p.r.F &= 0x9f;
    p.r.F |= 0x10;
    p.clock.c += 4;
  },
  DAA(p) {
    const sub = p.r.F & 0x40 ? 1 : 0;
    const h = p.r.F & 0x20 ? 1 : 0;
    let c = p.r.F & 0x10 ? 1 : 0;
    if (sub) {
      if (h) {
        p.r.A = (p.r.A - 0x6) & 0xff;
      }
      if (c) {
        p.r.A -= 0x60;
      }
    } else {
      if ((p.r.A & 0xf) > 9 || h) {
        p.r.A += 0x6;
      }
      if (p.r.A > 0x9f || c) {
        p.r.A += 0x60;
      }
    }
    if (p.r.A & 0x100) c = 1;

    p.r.A &= 0xff;
    p.r.F &= 0x40;
    if (p.r.A === 0) p.r.F |= 0x80;
    if (c) p.r.F |= 0x10;
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
    p.enableInterrupts();
    p.clock.c += 4;
  },
  RETI(p) {
    p.enableInterrupts();
    ops.RET(p);
  },
  CB(p) {
    const opcode = p.memory.rb(p.r.pc++);
    opcodeCbmap[opcode](p);
    p.clock.c += 4;
  },
};

export { ops as cpuOps };
