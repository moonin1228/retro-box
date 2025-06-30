import {
  createGameBoyCPU,
  FLAG_C,
  FLAG_N,
  FLAG_Z,
  getFlag,
  read8Reg,
  read16Reg,
  write8Reg,
  write16Reg,
} from "@/emulator/cpu/cpu.js";
import { executeOpcode } from "@/emulator/cpu/opcodes.js";
import { read8 } from "@/emulator/memory/mmu.js";

jest.mock("@/emulator/memory/mmu.js", () => ({
  read8: jest.fn(),
  read16: jest.fn(),
  write8: jest.fn(),
  write16: jest.fn(),
}));

describe("Game Boy CPU 테스트", () => {
  let cpu;

  beforeEach(() => {
    cpu = createGameBoyCPU();
    cpu.cycles = 0;
    jest.clearAllMocks();
  });

  test("NOP가 작동하는지 테스트", () => {
    executeOpcode(cpu, 0x00);
    expect(cpu.cycles).toBe(4);
  });

  test("LD A 테스트", () => {
    write16Reg(cpu, "PC", 0x0000);
    read8.mockReturnValueOnce(0x42);

    executeOpcode(cpu, 0x3e);

    expect(read8Reg(cpu, "A")).toBe(0x42);

    expect(read16Reg(cpu, "PC")).toBe(0x0001);
  });

  test("LD B 테스트", () => {
    write16Reg(cpu, "PC", 0x0000);
    read8.mockReturnValueOnce(0xff);

    executeOpcode(cpu, 0x06);

    expect(read8Reg(cpu, "B")).toBe(0xff);
    expect(cpu.cycles).toBe(8);
  });

  test("INC B 테스트 - B가 1 증가해야한다.", () => {
    write8Reg(cpu, "B", 0x00);

    executeOpcode(cpu, 0x04);

    expect(read8Reg(cpu, "B")).toBe(0x01);
    expect(getFlag(cpu, FLAG_Z)).toBe(false);
  });

  test("DEC C 테스트", () => {
    write8Reg(cpu, "C", 0x02);

    executeOpcode(cpu, 0x0d);

    expect(read8Reg(cpu, "C")).toBe(0x01);
    expect(getFlag(cpu, FLAG_N)).toBe(true);
  });

  test("ADD A,B 기본 테스트", () => {
    write8Reg(cpu, "A", 0x10);
    write8Reg(cpu, "B", 0x20);

    executeOpcode(cpu, 0x80);

    expect(read8Reg(cpu, "A")).toBe(0x30);
    expect(getFlag(cpu, FLAG_C)).toBe(false);
  });

  test("JR 앞으로 점프", () => {
    write16Reg(cpu, "PC", 0x1000);
    read8.mockReturnValueOnce(10);

    executeOpcode(cpu, 0x18);

    expect(read16Reg(cpu, "PC")).toBe(0x100b);
  });

  test("JR 뒤로 점프", () => {
    write16Reg(cpu, "PC", 0x2000);
    read8.mockReturnValueOnce(0xfb);

    executeOpcode(cpu, 0x18);

    expect(read16Reg(cpu, "PC")).toBe(0x1ffc);
    expect(cpu.cycles).toBe(12);
  });
});
