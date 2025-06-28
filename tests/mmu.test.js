import { enableBootRom, isBootActive } from "@/constants/bootRom.js";
import { vram, wram } from "@/constants/memoryArrays.js";
import { read8, write8 } from "@/emulator/memory/mmu.js";

beforeEach(() => {
  vram.fill(0);
  wram.fill(0);
  enableBootRom();
});

test("VRAM(0x8000) 에 기록한 값이 RAM 0xE123 에서 그대로 읽힌다", () => {
  write8(0x8000, 0xab);
  expect(read8(0x8000)).toBe(0xab);
});

test("WRAM 0xC123 에 기록한 값이 RAM 0xE123 에서 그대로 읽힌다", () => {
  write8(0xc123, 0x77);
  expect(read8(0xe123)).toBe(0x77);
});

test("0xFF50 ← 1 실행 시 bootActive 플래그가 true → false 로 전환된다", () => {
  expect(isBootActive()).toBe(true);
  write8(0xff50, 1);
  expect(isBootActive()).toBe(false);
});
