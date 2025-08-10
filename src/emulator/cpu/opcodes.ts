// @ts-nocheck
import { cpuOps as ops } from "@/emulator/cpu/instructions.js";

const map = {
  0x00(cpu) {
    cpu.clock.cycles += 4;
  },
  0x01(cpu) {
    ops.LDrrnn(cpu, "B", "C");
  },
  0x02(cpu) {
    ops.LDrrar(cpu, "B", "C", "A");
  },
  0x03(cpu) {
    ops.INCrr(cpu, "B", "C");
  },
  0x04(cpu) {
    ops.INCr(cpu, "B");
  },
  0x05(cpu) {
    ops.DECr(cpu, "B");
  },
  0x06(cpu) {
    ops.LDrn(cpu, "B");
  },
  0x07(cpu) {
    const out = cpu.register.A & 0x80 ? 1 : 0;
    out ? (cpu.register.F = 0x10) : (cpu.register.F = 0);
    cpu.setRegister("A", ((cpu.register.A << 1) + out) & 0xff);
    cpu.clock.cycles += 4;
  },
  0x08(cpu) {
    ops.LDnnsp(cpu);
  },
  0x09(cpu) {
    ops.ADDrrrr(cpu, "H", "L", "B", "C");
  },
  0x0a(cpu) {
    ops.LDrrra(cpu, "A", "B", "C");
  },
  0x0b(cpu) {
    ops.DECrr(cpu, "B", "C");
  },
  0x0c(cpu) {
    ops.INCr(cpu, "C");
  },
  0x0d(cpu) {
    ops.DECr(cpu, "C");
  },
  0x0e(cpu) {
    ops.LDrn(cpu, "C");
  },
  0x0f(cpu) {
    const out = cpu.register.A & 0x01;
    out ? (cpu.register.F = 0x10) : (cpu.register.F = 0);
    cpu.setRegister("A", (cpu.register.A >> 1) | (out * 0x80));
    cpu.clock.cycles += 4;
  },

  0x10(cpu) {
    cpu.register.pc++;
    cpu.clock.cycles += 4;
  },
  0x11(cpu) {
    ops.LDrrnn(cpu, "D", "E");
  },
  0x12(cpu) {
    ops.LDrrar(cpu, "D", "E", "A");
  },
  0x13(cpu) {
    ops.INCrr(cpu, "D", "E");
  },
  0x14(cpu) {
    ops.INCr(cpu, "D");
  },
  0x15(cpu) {
    ops.DECr(cpu, "D");
  },
  0x16(cpu) {
    ops.LDrn(cpu, "D");
  },
  0x17(cpu) {
    const c = cpu.register.F & 0x10 ? 1 : 0;
    const out = cpu.register.A & 0x80 ? 1 : 0;
    out ? (cpu.register.F = 0x10) : (cpu.register.F = 0);
    cpu.setRegister("A", ((cpu.register.A << 1) + c) & 0xff);
    cpu.clock.cycles += 4;
  },
  0x18(cpu) {
    ops.JRn(cpu);
  },
  0x19(cpu) {
    ops.ADDrrrr(cpu, "H", "L", "D", "E");
  },
  0x1a(cpu) {
    ops.LDrrra(cpu, "A", "D", "E");
  },
  0x1b(cpu) {
    ops.DECrr(cpu, "D", "E");
  },
  0x1c(cpu) {
    ops.INCr(cpu, "E");
  },
  0x1d(cpu) {
    ops.DECr(cpu, "E");
  },
  0x1e(cpu) {
    ops.LDrn(cpu, "E");
  },
  0x1f(cpu) {
    const c = cpu.register.F & 0x10 ? 1 : 0;
    const out = cpu.register.A & 0x01;
    out ? (cpu.register.F = 0x10) : (cpu.register.F = 0);
    cpu.setRegister("A", (cpu.register.A >> 1) | (c * 0x80));
    cpu.clock.cycles += 4;
  },

  0x20(cpu) {
    ops.JRccn(cpu, "NZ");
  },
  0x21(cpu) {
    ops.LDrrnn(cpu, "H", "L");
  },
  0x22(cpu) {
    ops.LDrrar(cpu, "H", "L", "A");
    ops.INCrr(cpu, "H", "L");
    cpu.clock.cycles -= 8;
  },
  0x23(cpu) {
    ops.INCrr(cpu, "H", "L");
  },
  0x24(cpu) {
    ops.INCr(cpu, "H");
  },
  0x25(cpu) {
    ops.DECr(cpu, "H");
  },
  0x26(cpu) {
    ops.LDrn(cpu, "H");
  },
  0x27(cpu) {
    ops.DAA(cpu);
  },
  0x28(cpu) {
    ops.JRccn(cpu, "Z");
  },
  0x29(cpu) {
    ops.ADDrrrr(cpu, "H", "L", "H", "L");
  },
  0x2a(cpu) {
    ops.LDrrra(cpu, "A", "H", "L");
    ops.INCrr(cpu, "H", "L");
    cpu.clock.cycles -= 8;
  },
  0x2b(cpu) {
    ops.DECrr(cpu, "H", "L");
  },
  0x2c(cpu) {
    ops.INCr(cpu, "L");
  },
  0x2d(cpu) {
    ops.DECr(cpu, "L");
  },
  0x2e(cpu) {
    ops.LDrn(cpu, "L");
  },
  0x2f(cpu) {
    ops.CPL(cpu);
  },

  0x30(cpu) {
    ops.JRccn(cpu, "NC");
  },
  0x31(cpu) {
    ops.LDspnn(cpu);
  },
  0x32(cpu) {
    ops.LDrrar(cpu, "H", "L", "A");
    ops.DECrr(cpu, "H", "L");
    cpu.clock.cycles -= 8;
  },
  0x33(cpu) {
    ops.INCsp(cpu);
  },
  0x34(cpu) {
    ops.INCrra(cpu, "H", "L");
  },
  0x35(cpu) {
    ops.DECrra(cpu, "H", "L");
  },
  0x36(cpu) {
    ops.LDrran(cpu, "H", "L");
  },
  0x37(cpu) {
    ops.SCF(cpu);
  },
  0x38(cpu) {
    ops.JRccn(cpu, "C");
  },
  0x39(cpu) {
    ops.ADDrrsp(cpu, "H", "L");
  },
  0x3a(cpu) {
    ops.LDrrra(cpu, "A", "H", "L");
    ops.DECrr(cpu, "H", "L");
    cpu.clock.cycles -= 8;
  },
  0x3b(cpu) {
    ops.DECsp(cpu);
  },
  0x3c(cpu) {
    ops.INCr(cpu, "A");
  },
  0x3d(cpu) {
    ops.DECr(cpu, "A");
  },
  0x3e(cpu) {
    ops.LDrn(cpu, "A");
  },
  0x3f(cpu) {
    ops.CCF(cpu);
  },

  0x40(cpu) {
    ops.LDrr(cpu, "B", "B");
  },
  0x41(cpu) {
    ops.LDrr(cpu, "B", "C");
  },
  0x42(cpu) {
    ops.LDrr(cpu, "B", "D");
  },
  0x43(cpu) {
    ops.LDrr(cpu, "B", "E");
  },
  0x44(cpu) {
    ops.LDrr(cpu, "B", "H");
  },
  0x45(cpu) {
    ops.LDrr(cpu, "B", "L");
  },
  0x46(cpu) {
    ops.LDrrra(cpu, "B", "H", "L");
  },
  0x47(cpu) {
    ops.LDrr(cpu, "B", "A");
  },
  0x48(cpu) {
    ops.LDrr(cpu, "C", "B");
  },
  0x49(cpu) {
    ops.LDrr(cpu, "C", "C");
  },
  0x4a(cpu) {
    ops.LDrr(cpu, "C", "D");
  },
  0x4b(cpu) {
    ops.LDrr(cpu, "C", "E");
  },
  0x4c(cpu) {
    ops.LDrr(cpu, "C", "H");
  },
  0x4d(cpu) {
    ops.LDrr(cpu, "C", "L");
  },
  0x4e(cpu) {
    ops.LDrrra(cpu, "C", "H", "L");
  },
  0x4f(cpu) {
    ops.LDrr(cpu, "C", "A");
  },

  0x50(cpu) {
    ops.LDrr(cpu, "D", "B");
  },
  0x51(cpu) {
    ops.LDrr(cpu, "D", "C");
  },
  0x52(cpu) {
    ops.LDrr(cpu, "D", "D");
  },
  0x53(cpu) {
    ops.LDrr(cpu, "D", "E");
  },
  0x54(cpu) {
    ops.LDrr(cpu, "D", "H");
  },
  0x55(cpu) {
    ops.LDrr(cpu, "D", "L");
  },
  0x56(cpu) {
    ops.LDrrra(cpu, "D", "H", "L");
  },
  0x57(cpu) {
    ops.LDrr(cpu, "D", "A");
  },
  0x58(cpu) {
    ops.LDrr(cpu, "E", "B");
  },
  0x59(cpu) {
    ops.LDrr(cpu, "E", "C");
  },
  0x5a(cpu) {
    ops.LDrr(cpu, "E", "D");
  },
  0x5b(cpu) {
    ops.LDrr(cpu, "E", "E");
  },
  0x5c(cpu) {
    ops.LDrr(cpu, "E", "H");
  },
  0x5d(cpu) {
    ops.LDrr(cpu, "E", "L");
  },
  0x5e(cpu) {
    ops.LDrrra(cpu, "E", "H", "L");
  },
  0x5f(cpu) {
    ops.LDrr(cpu, "E", "A");
  },

  0x60(cpu) {
    ops.LDrr(cpu, "H", "B");
  },
  0x61(cpu) {
    ops.LDrr(cpu, "H", "C");
  },
  0x62(cpu) {
    ops.LDrr(cpu, "H", "D");
  },
  0x63(cpu) {
    ops.LDrr(cpu, "H", "E");
  },
  0x64(cpu) {
    ops.LDrr(cpu, "H", "H");
  },
  0x65(cpu) {
    ops.LDrr(cpu, "H", "L");
  },
  0x66(cpu) {
    ops.LDrrra(cpu, "H", "H", "L");
  },
  0x67(cpu) {
    ops.LDrr(cpu, "H", "A");
  },
  0x68(cpu) {
    ops.LDrr(cpu, "L", "B");
  },
  0x69(cpu) {
    ops.LDrr(cpu, "L", "C");
  },
  0x6a(cpu) {
    ops.LDrr(cpu, "L", "D");
  },
  0x6b(cpu) {
    ops.LDrr(cpu, "L", "E");
  },
  0x6c(cpu) {
    ops.LDrr(cpu, "L", "H");
  },
  0x6d(cpu) {
    ops.LDrr(cpu, "L", "L");
  },
  0x6e(cpu) {
    ops.LDrrra(cpu, "L", "H", "L");
  },
  0x6f(cpu) {
    ops.LDrr(cpu, "L", "A");
  },

  0x70(cpu) {
    ops.LDrrar(cpu, "H", "L", "B");
  },
  0x71(cpu) {
    ops.LDrrar(cpu, "H", "L", "C");
  },
  0x72(cpu) {
    ops.LDrrar(cpu, "H", "L", "D");
  },
  0x73(cpu) {
    ops.LDrrar(cpu, "H", "L", "E");
  },
  0x74(cpu) {
    ops.LDrrar(cpu, "H", "L", "H");
  },
  0x75(cpu) {
    ops.LDrrar(cpu, "H", "L", "L");
  },
  0x76(cpu) {
    ops.HALT(cpu);
  },
  0x77(cpu) {
    ops.LDrrar(cpu, "H", "L", "A");
  },
  0x78(cpu) {
    ops.LDrr(cpu, "A", "B");
  },
  0x79(cpu) {
    ops.LDrr(cpu, "A", "C");
  },
  0x7a(cpu) {
    ops.LDrr(cpu, "A", "D");
  },
  0x7b(cpu) {
    ops.LDrr(cpu, "A", "E");
  },
  0x7c(cpu) {
    ops.LDrr(cpu, "A", "H");
  },
  0x7d(cpu) {
    ops.LDrr(cpu, "A", "L");
  },
  0x7e(cpu) {
    ops.LDrrra(cpu, "A", "H", "L");
  },
  0x7f(cpu) {
    ops.LDrr(cpu, "A", "A");
  },

  0x80(cpu) {
    ops.ADDrr(cpu, "A", "B");
  },
  0x81(cpu) {
    ops.ADDrr(cpu, "A", "C");
  },
  0x82(cpu) {
    ops.ADDrr(cpu, "A", "D");
  },
  0x83(cpu) {
    ops.ADDrr(cpu, "A", "E");
  },
  0x84(cpu) {
    ops.ADDrr(cpu, "A", "H");
  },
  0x85(cpu) {
    ops.ADDrr(cpu, "A", "L");
  },
  0x86(cpu) {
    ops.ADDrrra(cpu, "A", "H", "L");
  },
  0x87(cpu) {
    ops.ADDrr(cpu, "A", "A");
  },
  0x88(cpu) {
    ops.ADCrr(cpu, "A", "B");
  },
  0x89(cpu) {
    ops.ADCrr(cpu, "A", "C");
  },
  0x8a(cpu) {
    ops.ADCrr(cpu, "A", "D");
  },
  0x8b(cpu) {
    ops.ADCrr(cpu, "A", "E");
  },
  0x8c(cpu) {
    ops.ADCrr(cpu, "A", "H");
  },
  0x8d(cpu) {
    ops.ADCrr(cpu, "A", "L");
  },
  0x8e(cpu) {
    ops.ADCrrra(cpu, "A", "H", "L");
  },
  0x8f(cpu) {
    ops.ADCrr(cpu, "A", "A");
  },

  0x90(cpu) {
    ops.SUBr(cpu, "B");
  },
  0x91(cpu) {
    ops.SUBr(cpu, "C");
  },
  0x92(cpu) {
    ops.SUBr(cpu, "D");
  },
  0x93(cpu) {
    ops.SUBr(cpu, "E");
  },
  0x94(cpu) {
    ops.SUBr(cpu, "H");
  },
  0x95(cpu) {
    ops.SUBr(cpu, "L");
  },
  0x96(cpu) {
    ops.SUBrra(cpu, "H", "L");
  },
  0x97(cpu) {
    ops.SUBr(cpu, "A");
  },
  0x98(cpu) {
    ops.SBCr(cpu, "B");
  },
  0x99(cpu) {
    ops.SBCr(cpu, "C");
  },
  0x9a(cpu) {
    ops.SBCr(cpu, "D");
  },
  0x9b(cpu) {
    ops.SBCr(cpu, "E");
  },
  0x9c(cpu) {
    ops.SBCr(cpu, "H");
  },
  0x9d(cpu) {
    ops.SBCr(cpu, "L");
  },
  0x9e(cpu) {
    ops.SBCrra(cpu, "H", "L");
  },
  0x9f(cpu) {
    ops.SBCr(cpu, "A");
  },

  0xa0(cpu) {
    ops.ANDr(cpu, "B");
  },
  0xa1(cpu) {
    ops.ANDr(cpu, "C");
  },
  0xa2(cpu) {
    ops.ANDr(cpu, "D");
  },
  0xa3(cpu) {
    ops.ANDr(cpu, "E");
  },
  0xa4(cpu) {
    ops.ANDr(cpu, "H");
  },
  0xa5(cpu) {
    ops.ANDr(cpu, "L");
  },
  0xa6(cpu) {
    ops.ANDrra(cpu, "H", "L");
  },
  0xa7(cpu) {
    ops.ANDr(cpu, "A");
  },
  0xa8(cpu) {
    ops.XORr(cpu, "B");
  },
  0xa9(cpu) {
    ops.XORr(cpu, "C");
  },
  0xaa(cpu) {
    ops.XORr(cpu, "D");
  },
  0xab(cpu) {
    ops.XORr(cpu, "E");
  },
  0xac(cpu) {
    ops.XORr(cpu, "H");
  },
  0xad(cpu) {
    ops.XORr(cpu, "L");
  },
  0xae(cpu) {
    ops.XORrra(cpu, "H", "L");
  },
  0xaf(cpu) {
    ops.XORr(cpu, "A");
  },

  0xb0(cpu) {
    ops.ORr(cpu, "B");
  },
  0xb1(cpu) {
    ops.ORr(cpu, "C");
  },
  0xb2(cpu) {
    ops.ORr(cpu, "D");
  },
  0xb3(cpu) {
    ops.ORr(cpu, "E");
  },
  0xb4(cpu) {
    ops.ORr(cpu, "H");
  },
  0xb5(cpu) {
    ops.ORr(cpu, "L");
  },
  0xb6(cpu) {
    ops.ORrra(cpu, "H", "L");
  },
  0xb7(cpu) {
    ops.ORr(cpu, "A");
  },
  0xb8(cpu) {
    ops.CPr(cpu, "B");
  },
  0xb9(cpu) {
    ops.CPr(cpu, "C");
  },
  0xba(cpu) {
    ops.CPr(cpu, "D");
  },
  0xbb(cpu) {
    ops.CPr(cpu, "E");
  },
  0xbc(cpu) {
    ops.CPr(cpu, "H");
  },
  0xbd(cpu) {
    ops.CPr(cpu, "L");
  },
  0xbe(cpu) {
    ops.CPrra(cpu, "H", "L");
  },
  0xbf(cpu) {
    ops.CPr(cpu, "A");
  },

  0xc0(cpu) {
    ops.RETcc(cpu, "NZ");
  },
  0xc1(cpu) {
    ops.POPrr(cpu, "B", "C");
  },
  0xc2(cpu) {
    ops.JPccnn(cpu, "NZ");
  },
  0xc3(cpu) {
    ops.JPnn(cpu);
  },
  0xc4(cpu) {
    ops.CALLccnn(cpu, "NZ");
  },
  0xc5(cpu) {
    ops.PUSHrr(cpu, "B", "C");
  },
  0xc6(cpu) {
    ops.ADDrn(cpu, "A");
  },
  0xc7(cpu) {
    ops.RSTn(cpu, 0x00);
  },
  0xc8(cpu) {
    ops.RETcc(cpu, "Z");
  },
  0xc9(cpu) {
    ops.RET(cpu);
  },
  0xca(cpu) {
    ops.JPccnn(cpu, "Z");
  },
  0xcb(cpu) {
    ops.CB(cpu);
  },
  0xcc(cpu) {
    ops.CALLccnn(cpu, "Z");
  },
  0xcd(cpu) {
    ops.CALLnn(cpu);
  },
  0xce(cpu) {
    ops.ADCrn(cpu, "A");
  },
  0xcf(cpu) {
    ops.RSTn(cpu, 0x08);
  },

  0xd0(cpu) {
    ops.RETcc(cpu, "NC");
  },
  0xd1(cpu) {
    ops.POPrr(cpu, "D", "E");
  },
  0xd2(cpu) {
    ops.JPccnn(cpu, "NC");
  },
  0xd4(cpu) {
    ops.CALLccnn(cpu, "NC");
  },
  0xd5(cpu) {
    ops.PUSHrr(cpu, "D", "E");
  },
  0xd6(cpu) {
    ops.SUBn(cpu);
  },
  0xd7(cpu) {
    ops.RSTn(cpu, 0x10);
  },
  0xd8(cpu) {
    ops.RETcc(cpu, "C");
  },
  0xd9(cpu) {
    ops.RETI(cpu);
  },
  0xda(cpu) {
    ops.JPccnn(cpu, "C");
  },
  0xdc(cpu) {
    ops.CALLccnn(cpu, "C");
  },
  0xde(cpu) {
    ops.SBCn(cpu);
  },
  0xdf(cpu) {
    ops.RSTn(cpu, 0x18);
  },

  0xe0(cpu) {
    ops.LDHnar(cpu, "A");
  },
  0xe1(cpu) {
    ops.POPrr(cpu, "H", "L");
  },
  0xe2(cpu) {
    ops.LDrar(cpu, "C", "A");
  },
  0xe5(cpu) {
    ops.PUSHrr(cpu, "H", "L");
  },
  0xe6(cpu) {
    ops.ANDn(cpu);
  },
  0xe7(cpu) {
    ops.RSTn(cpu, 0x20);
  },
  0xe8(cpu) {
    ops.ADDspn(cpu);
  },
  0xe9(cpu) {
    ops.JPrr(cpu, "H", "L");
  },
  0xea(cpu) {
    ops.LDnnar(cpu, "A");
  },
  0xee(cpu) {
    ops.XORn(cpu);
  },
  0xef(cpu) {
    ops.RSTn(cpu, 0x28);
  },

  0xf0(cpu) {
    ops.LDHrna(cpu, "A");
  },
  0xf1(cpu) {
    ops.POPrr(cpu, "A", "F");
  },
  0xf2(cpu) {
    ops.LDrra(cpu, "A", "C");
  },
  0xf3(cpu) {
    ops.DI(cpu);
  },
  0xf5(cpu) {
    ops.PUSHrr(cpu, "A", "F");
  },
  0xf6(cpu) {
    ops.ORn(cpu);
  },
  0xf7(cpu) {
    ops.RSTn(cpu, 0x30);
  },
  0xf8(cpu) {
    ops.LDrrspn(cpu, "H", "L");
  },
  0xf9(cpu) {
    ops.LDsprr(cpu, "H", "L");
  },
  0xfa(cpu) {
    ops.LDrnna(cpu, "A");
  },
  0xfb(cpu) {
    ops.EI(cpu);
  },
  0xfe(cpu) {
    ops.CPn(cpu);
  },
  0xff(cpu) {
    ops.RSTn(cpu, 0x38);
  },
};

const cbmap = {
  0x00(cpu) {
    ops.RLCr(cpu, "B");
  },
  0x01(cpu) {
    ops.RLCr(cpu, "C");
  },
  0x02(cpu) {
    ops.RLCr(cpu, "D");
  },
  0x03(cpu) {
    ops.RLCr(cpu, "E");
  },
  0x04(cpu) {
    ops.RLCr(cpu, "H");
  },
  0x05(cpu) {
    ops.RLCr(cpu, "L");
  },
  0x06(cpu) {
    ops.RLCrra(cpu, "H", "L");
  },
  0x07(cpu) {
    ops.RLCr(cpu, "A");
  },
  0x08(cpu) {
    ops.RRCr(cpu, "B");
  },
  0x09(cpu) {
    ops.RRCr(cpu, "C");
  },
  0x0a(cpu) {
    ops.RRCr(cpu, "D");
  },
  0x0b(cpu) {
    ops.RRCr(cpu, "E");
  },
  0x0c(cpu) {
    ops.RRCr(cpu, "H");
  },
  0x0d(cpu) {
    ops.RRCr(cpu, "L");
  },
  0x0e(cpu) {
    ops.RRCrra(cpu, "H", "L");
  },
  0x0f(cpu) {
    ops.RRCr(cpu, "A");
  },

  0x10(cpu) {
    ops.RLr(cpu, "B");
  },
  0x11(cpu) {
    ops.RLr(cpu, "C");
  },
  0x12(cpu) {
    ops.RLr(cpu, "D");
  },
  0x13(cpu) {
    ops.RLr(cpu, "E");
  },
  0x14(cpu) {
    ops.RLr(cpu, "H");
  },
  0x15(cpu) {
    ops.RLr(cpu, "L");
  },
  0x16(cpu) {
    ops.RLrra(cpu, "H", "L");
  },
  0x17(cpu) {
    ops.RLr(cpu, "A");
  },
  0x18(cpu) {
    ops.RRr(cpu, "B");
  },
  0x19(cpu) {
    ops.RRr(cpu, "C");
  },
  0x1a(cpu) {
    ops.RRr(cpu, "D");
  },
  0x1b(cpu) {
    ops.RRr(cpu, "E");
  },
  0x1c(cpu) {
    ops.RRr(cpu, "H");
  },
  0x1d(cpu) {
    ops.RRr(cpu, "L");
  },
  0x1e(cpu) {
    ops.RRrra(cpu, "H", "L");
  },
  0x1f(cpu) {
    ops.RRr(cpu, "A");
  },

  0x20(cpu) {
    ops.SLAr(cpu, "B");
  },
  0x21(cpu) {
    ops.SLAr(cpu, "C");
  },
  0x22(cpu) {
    ops.SLAr(cpu, "D");
  },
  0x23(cpu) {
    ops.SLAr(cpu, "E");
  },
  0x24(cpu) {
    ops.SLAr(cpu, "H");
  },
  0x25(cpu) {
    ops.SLAr(cpu, "L");
  },
  0x26(cpu) {
    ops.SLArra(cpu, "H", "L");
  },
  0x27(cpu) {
    ops.SLAr(cpu, "A");
  },
  0x28(cpu) {
    ops.SRAr(cpu, "B");
  },
  0x29(cpu) {
    ops.SRAr(cpu, "C");
  },
  0x2a(cpu) {
    ops.SRAr(cpu, "D");
  },
  0x2b(cpu) {
    ops.SRAr(cpu, "E");
  },
  0x2c(cpu) {
    ops.SRAr(cpu, "H");
  },
  0x2d(cpu) {
    ops.SRAr(cpu, "L");
  },
  0x2e(cpu) {
    ops.SRArra(cpu, "H", "L");
  },
  0x2f(cpu) {
    ops.SRAr(cpu, "A");
  },

  0x30(cpu) {
    ops.SWAPr(cpu, "B");
  },
  0x31(cpu) {
    ops.SWAPr(cpu, "C");
  },
  0x32(cpu) {
    ops.SWAPr(cpu, "D");
  },
  0x33(cpu) {
    ops.SWAPr(cpu, "E");
  },
  0x34(cpu) {
    ops.SWAPr(cpu, "H");
  },
  0x35(cpu) {
    ops.SWAPr(cpu, "L");
  },
  0x36(cpu) {
    ops.SWAPrra(cpu, "H", "L");
  },
  0x37(cpu) {
    ops.SWAPr(cpu, "A");
  },
  0x38(cpu) {
    ops.SRLr(cpu, "B");
  },
  0x39(cpu) {
    ops.SRLr(cpu, "C");
  },
  0x3a(cpu) {
    ops.SRLr(cpu, "D");
  },
  0x3b(cpu) {
    ops.SRLr(cpu, "E");
  },
  0x3c(cpu) {
    ops.SRLr(cpu, "H");
  },
  0x3d(cpu) {
    ops.SRLr(cpu, "L");
  },
  0x3e(cpu) {
    ops.SRLrra(cpu, "H", "L");
  },
  0x3f(cpu) {
    ops.SRLr(cpu, "A");
  },

  0x40(cpu) {
    ops.BITir(cpu, 0, "B");
  },
  0x41(cpu) {
    ops.BITir(cpu, 0, "C");
  },
  0x42(cpu) {
    ops.BITir(cpu, 0, "D");
  },
  0x43(cpu) {
    ops.BITir(cpu, 0, "E");
  },
  0x44(cpu) {
    ops.BITir(cpu, 0, "H");
  },
  0x45(cpu) {
    ops.BITir(cpu, 0, "L");
  },
  0x46(cpu) {
    ops.BITirra(cpu, 0, "H", "L");
  },
  0x47(cpu) {
    ops.BITir(cpu, 0, "A");
  },
  0x48(cpu) {
    ops.BITir(cpu, 1, "B");
  },
  0x49(cpu) {
    ops.BITir(cpu, 1, "C");
  },
  0x4a(cpu) {
    ops.BITir(cpu, 1, "D");
  },
  0x4b(cpu) {
    ops.BITir(cpu, 1, "E");
  },
  0x4c(cpu) {
    ops.BITir(cpu, 1, "H");
  },
  0x4d(cpu) {
    ops.BITir(cpu, 1, "L");
  },
  0x4e(cpu) {
    ops.BITirra(cpu, 1, "H", "L");
  },
  0x4f(cpu) {
    ops.BITir(cpu, 1, "A");
  },

  0x50(cpu) {
    ops.BITir(cpu, 2, "B");
  },
  0x51(cpu) {
    ops.BITir(cpu, 2, "C");
  },
  0x52(cpu) {
    ops.BITir(cpu, 2, "D");
  },
  0x53(cpu) {
    ops.BITir(cpu, 2, "E");
  },
  0x54(cpu) {
    ops.BITir(cpu, 2, "H");
  },
  0x55(cpu) {
    ops.BITir(cpu, 2, "L");
  },
  0x56(cpu) {
    ops.BITirra(cpu, 2, "H", "L");
  },
  0x57(cpu) {
    ops.BITir(cpu, 2, "A");
  },
  0x58(cpu) {
    ops.BITir(cpu, 3, "B");
  },
  0x59(cpu) {
    ops.BITir(cpu, 3, "C");
  },
  0x5a(cpu) {
    ops.BITir(cpu, 3, "D");
  },
  0x5b(cpu) {
    ops.BITir(cpu, 3, "E");
  },
  0x5c(cpu) {
    ops.BITir(cpu, 3, "H");
  },
  0x5d(cpu) {
    ops.BITir(cpu, 3, "L");
  },
  0x5e(cpu) {
    ops.BITirra(cpu, 3, "H", "L");
  },
  0x5f(cpu) {
    ops.BITir(cpu, 3, "A");
  },

  0x60(cpu) {
    ops.BITir(cpu, 4, "B");
  },
  0x61(cpu) {
    ops.BITir(cpu, 4, "C");
  },
  0x62(cpu) {
    ops.BITir(cpu, 4, "D");
  },
  0x63(cpu) {
    ops.BITir(cpu, 4, "E");
  },
  0x64(cpu) {
    ops.BITir(cpu, 4, "H");
  },
  0x65(cpu) {
    ops.BITir(cpu, 4, "L");
  },
  0x66(cpu) {
    ops.BITirra(cpu, 4, "H", "L");
  },
  0x67(cpu) {
    ops.BITir(cpu, 4, "A");
  },
  0x68(cpu) {
    ops.BITir(cpu, 5, "B");
  },
  0x69(cpu) {
    ops.BITir(cpu, 5, "C");
  },
  0x6a(cpu) {
    ops.BITir(cpu, 5, "D");
  },
  0x6b(cpu) {
    ops.BITir(cpu, 5, "E");
  },
  0x6c(cpu) {
    ops.BITir(cpu, 5, "H");
  },
  0x6d(cpu) {
    ops.BITir(cpu, 5, "L");
  },
  0x6e(cpu) {
    ops.BITirra(cpu, 5, "H", "L");
  },
  0x6f(cpu) {
    ops.BITir(cpu, 5, "A");
  },

  0x70(cpu) {
    ops.BITir(cpu, 6, "B");
  },
  0x71(cpu) {
    ops.BITir(cpu, 6, "C");
  },
  0x72(cpu) {
    ops.BITir(cpu, 6, "D");
  },
  0x73(cpu) {
    ops.BITir(cpu, 6, "E");
  },
  0x74(cpu) {
    ops.BITir(cpu, 6, "H");
  },
  0x75(cpu) {
    ops.BITir(cpu, 6, "L");
  },
  0x76(cpu) {
    ops.BITirra(cpu, 6, "H", "L");
  },
  0x77(cpu) {
    ops.BITir(cpu, 6, "A");
  },
  0x78(cpu) {
    ops.BITir(cpu, 7, "B");
  },
  0x79(cpu) {
    ops.BITir(cpu, 7, "C");
  },
  0x7a(cpu) {
    ops.BITir(cpu, 7, "D");
  },
  0x7b(cpu) {
    ops.BITir(cpu, 7, "E");
  },
  0x7c(cpu) {
    ops.BITir(cpu, 7, "H");
  },
  0x7d(cpu) {
    ops.BITir(cpu, 7, "L");
  },
  0x7e(cpu) {
    ops.BITirra(cpu, 7, "H", "L");
  },
  0x7f(cpu) {
    ops.BITir(cpu, 7, "A");
  },

  0x80(cpu) {
    ops.RESir(cpu, 0, "B");
  },
  0x81(cpu) {
    ops.RESir(cpu, 0, "C");
  },
  0x82(cpu) {
    ops.RESir(cpu, 0, "D");
  },
  0x83(cpu) {
    ops.RESir(cpu, 0, "E");
  },
  0x84(cpu) {
    ops.RESir(cpu, 0, "H");
  },
  0x85(cpu) {
    ops.RESir(cpu, 0, "L");
  },
  0x86(cpu) {
    ops.RESirra(cpu, 0, "H", "L");
  },
  0x87(cpu) {
    ops.RESir(cpu, 0, "A");
  },
  0x88(cpu) {
    ops.RESir(cpu, 1, "B");
  },
  0x89(cpu) {
    ops.RESir(cpu, 1, "C");
  },
  0x8a(cpu) {
    ops.RESir(cpu, 1, "D");
  },
  0x8b(cpu) {
    ops.RESir(cpu, 1, "E");
  },
  0x8c(cpu) {
    ops.RESir(cpu, 1, "H");
  },
  0x8d(cpu) {
    ops.RESir(cpu, 1, "L");
  },
  0x8e(cpu) {
    ops.RESirra(cpu, 1, "H", "L");
  },
  0x8f(cpu) {
    ops.RESir(cpu, 1, "A");
  },

  0x90(cpu) {
    ops.RESir(cpu, 2, "B");
  },
  0x91(cpu) {
    ops.RESir(cpu, 2, "C");
  },
  0x92(cpu) {
    ops.RESir(cpu, 2, "D");
  },
  0x93(cpu) {
    ops.RESir(cpu, 2, "E");
  },
  0x94(cpu) {
    ops.RESir(cpu, 2, "H");
  },
  0x95(cpu) {
    ops.RESir(cpu, 2, "L");
  },
  0x96(cpu) {
    ops.RESirra(cpu, 2, "H", "L");
  },
  0x97(cpu) {
    ops.RESir(cpu, 2, "A");
  },
  0x98(cpu) {
    ops.RESir(cpu, 3, "B");
  },
  0x99(cpu) {
    ops.RESir(cpu, 3, "C");
  },
  0x9a(cpu) {
    ops.RESir(cpu, 3, "D");
  },
  0x9b(cpu) {
    ops.RESir(cpu, 3, "E");
  },
  0x9c(cpu) {
    ops.RESir(cpu, 3, "H");
  },
  0x9d(cpu) {
    ops.RESir(cpu, 3, "L");
  },
  0x9e(cpu) {
    ops.RESirra(cpu, 3, "H", "L");
  },
  0x9f(cpu) {
    ops.RESir(cpu, 3, "A");
  },

  0xa0(cpu) {
    ops.RESir(cpu, 4, "B");
  },
  0xa1(cpu) {
    ops.RESir(cpu, 4, "C");
  },
  0xa2(cpu) {
    ops.RESir(cpu, 4, "D");
  },
  0xa3(cpu) {
    ops.RESir(cpu, 4, "E");
  },
  0xa4(cpu) {
    ops.RESir(cpu, 4, "H");
  },
  0xa5(cpu) {
    ops.RESir(cpu, 4, "L");
  },
  0xa6(cpu) {
    ops.RESirra(cpu, 4, "H", "L");
  },
  0xa7(cpu) {
    ops.RESir(cpu, 4, "A");
  },
  0xa8(cpu) {
    ops.RESir(cpu, 5, "B");
  },
  0xa9(cpu) {
    ops.RESir(cpu, 5, "C");
  },
  0xaa(cpu) {
    ops.RESir(cpu, 5, "D");
  },
  0xab(cpu) {
    ops.RESir(cpu, 5, "E");
  },
  0xac(cpu) {
    ops.RESir(cpu, 5, "H");
  },
  0xad(cpu) {
    ops.RESir(cpu, 5, "L");
  },
  0xae(cpu) {
    ops.RESirra(cpu, 5, "H", "L");
  },
  0xaf(cpu) {
    ops.RESir(cpu, 5, "A");
  },

  0xb0(cpu) {
    ops.RESir(cpu, 6, "B");
  },
  0xb1(cpu) {
    ops.RESir(cpu, 6, "C");
  },
  0xb2(cpu) {
    ops.RESir(cpu, 6, "D");
  },
  0xb3(cpu) {
    ops.RESir(cpu, 6, "E");
  },
  0xb4(cpu) {
    ops.RESir(cpu, 6, "H");
  },
  0xb5(cpu) {
    ops.RESir(cpu, 6, "L");
  },
  0xb6(cpu) {
    ops.RESirra(cpu, 6, "H", "L");
  },
  0xb7(cpu) {
    ops.RESir(cpu, 6, "A");
  },
  0xb8(cpu) {
    ops.RESir(cpu, 7, "B");
  },
  0xb9(cpu) {
    ops.RESir(cpu, 7, "C");
  },
  0xba(cpu) {
    ops.RESir(cpu, 7, "D");
  },
  0xbb(cpu) {
    ops.RESir(cpu, 7, "E");
  },
  0xbc(cpu) {
    ops.RESir(cpu, 7, "H");
  },
  0xbd(cpu) {
    ops.RESir(cpu, 7, "L");
  },
  0xbe(cpu) {
    ops.RESirra(cpu, 7, "H", "L");
  },
  0xbf(cpu) {
    ops.RESir(cpu, 7, "A");
  },

  0xc0(cpu) {
    ops.SETir(cpu, 0, "B");
  },
  0xc1(cpu) {
    ops.SETir(cpu, 0, "C");
  },
  0xc2(cpu) {
    ops.SETir(cpu, 0, "D");
  },
  0xc3(cpu) {
    ops.SETir(cpu, 0, "E");
  },
  0xc4(cpu) {
    ops.SETir(cpu, 0, "H");
  },
  0xc5(cpu) {
    ops.SETir(cpu, 0, "L");
  },
  0xc6(cpu) {
    ops.SETirra(cpu, 0, "H", "L");
  },
  0xc7(cpu) {
    ops.SETir(cpu, 0, "A");
  },
  0xc8(cpu) {
    ops.SETir(cpu, 1, "B");
  },
  0xc9(cpu) {
    ops.SETir(cpu, 1, "C");
  },
  0xca(cpu) {
    ops.SETir(cpu, 1, "D");
  },
  0xcb(cpu) {
    ops.SETir(cpu, 1, "E");
  },
  0xcc(cpu) {
    ops.SETir(cpu, 1, "H");
  },
  0xcd(cpu) {
    ops.SETir(cpu, 1, "L");
  },
  0xce(cpu) {
    ops.SETirra(cpu, 1, "H", "L");
  },
  0xcf(cpu) {
    ops.SETir(cpu, 1, "A");
  },

  0xd0(cpu) {
    ops.SETir(cpu, 2, "B");
  },
  0xd1(cpu) {
    ops.SETir(cpu, 2, "C");
  },
  0xd2(cpu) {
    ops.SETir(cpu, 2, "D");
  },
  0xd3(cpu) {
    ops.SETir(cpu, 2, "E");
  },
  0xd4(cpu) {
    ops.SETir(cpu, 2, "H");
  },
  0xd5(cpu) {
    ops.SETir(cpu, 2, "L");
  },
  0xd6(cpu) {
    ops.SETirra(cpu, 2, "H", "L");
  },
  0xd7(cpu) {
    ops.SETir(cpu, 2, "A");
  },
  0xd8(cpu) {
    ops.SETir(cpu, 3, "B");
  },
  0xd9(cpu) {
    ops.SETir(cpu, 3, "C");
  },
  0xda(cpu) {
    ops.SETir(cpu, 3, "D");
  },
  0xdb(cpu) {
    ops.SETir(cpu, 3, "E");
  },
  0xdc(cpu) {
    ops.SETir(cpu, 3, "H");
  },
  0xdd(cpu) {
    ops.SETir(cpu, 3, "L");
  },
  0xde(cpu) {
    ops.SETirra(cpu, 3, "H", "L");
  },
  0xdf(cpu) {
    ops.SETir(cpu, 3, "A");
  },

  0xe0(cpu) {
    ops.SETir(cpu, 4, "B");
  },
  0xe1(cpu) {
    ops.SETir(cpu, 4, "C");
  },
  0xe2(cpu) {
    ops.SETir(cpu, 4, "D");
  },
  0xe3(cpu) {
    ops.SETir(cpu, 4, "E");
  },
  0xe4(cpu) {
    ops.SETir(cpu, 4, "H");
  },
  0xe5(cpu) {
    ops.SETir(cpu, 4, "L");
  },
  0xe6(cpu) {
    ops.SETirra(cpu, 4, "H", "L");
  },
  0xe7(cpu) {
    ops.SETir(cpu, 4, "A");
  },
  0xe8(cpu) {
    ops.SETir(cpu, 5, "B");
  },
  0xe9(cpu) {
    ops.SETir(cpu, 5, "C");
  },
  0xea(cpu) {
    ops.SETir(cpu, 5, "D");
  },
  0xeb(cpu) {
    ops.SETir(cpu, 5, "E");
  },
  0xec(cpu) {
    ops.SETir(cpu, 5, "H");
  },
  0xed(cpu) {
    ops.SETir(cpu, 5, "L");
  },
  0xee(cpu) {
    ops.SETirra(cpu, 5, "H", "L");
  },
  0xef(cpu) {
    ops.SETir(cpu, 5, "A");
  },

  0xf0(cpu) {
    ops.SETir(cpu, 6, "B");
  },
  0xf1(cpu) {
    ops.SETir(cpu, 6, "C");
  },
  0xf2(cpu) {
    ops.SETir(cpu, 6, "D");
  },
  0xf3(cpu) {
    ops.SETir(cpu, 6, "E");
  },
  0xf4(cpu) {
    ops.SETir(cpu, 6, "H");
  },
  0xf5(cpu) {
    ops.SETir(cpu, 6, "L");
  },
  0xf6(cpu) {
    ops.SETirra(cpu, 6, "H", "L");
  },
  0xf7(cpu) {
    ops.SETir(cpu, 6, "A");
  },
  0xf8(cpu) {
    ops.SETir(cpu, 7, "B");
  },
  0xf9(cpu) {
    ops.SETir(cpu, 7, "C");
  },
  0xfa(cpu) {
    ops.SETir(cpu, 7, "D");
  },
  0xfb(cpu) {
    ops.SETir(cpu, 7, "E");
  },
  0xfc(cpu) {
    ops.SETir(cpu, 7, "H");
  },
  0xfd(cpu) {
    ops.SETir(cpu, 7, "L");
  },
  0xfe(cpu) {
    ops.SETirra(cpu, 7, "H", "L");
  },
  0xff(cpu) {
    ops.SETir(cpu, 7, "A");
  },
};

export { cbmap as opcodeCbmap, map as opcodeMap };
