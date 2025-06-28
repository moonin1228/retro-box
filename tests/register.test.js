import registers from "@/emulator/cpu/registers.js";

describe("CPU registers", () => {
  test("초기값 검증", () => {
    expect(registers).toMatchObject({
      A: 0x00,
      B: 0x00,
      C: 0x00,
      D: 0x00,
      E: 0x00,
      F: 0x00,
      H: 0x00,
      L: 0x00,
      PC: 0x0100,
      SP: 0xfffe,
    });
  });

  test("8-bit read/write", () => {
    registers.A = 0x3c;
    registers.E = 0xab;
    expect(registers.A).toBe(0x3c);
    expect(registers.E).toBe(0xab);
  });
});
