import { read8, read16, write8, write16 } from "@/emulator/memory/memory.js";

test("8-bit read/write", () => {
  write8(0x1234, 0x7f);
  expect(read8(0x1234)).toBe(0x7f);
});

test("16-bit read/write (리틀앤디언)", () => {
  write16(0x5555, 0xbeef);
  expect(read16(0x5555)).toBe(0xbeef);
});
