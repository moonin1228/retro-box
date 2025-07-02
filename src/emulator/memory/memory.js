import createMBC from "@/emulator/memory/mbc.js";

const MEM_SIZE = 0x10000;
const BANK_SIZE = 0x4000;

export const addresses = Object.freeze({
  VRAM_START: 0x8000,
  VRAM_END: 0x9fff,
  EXTRAM_START: 0xa000,
  EXTRAM_END: 0xbfff,
  OAM_START: 0xfe00,
  OAM_END: 0xfe9f,
  DEVICE_START: 0xff00,
  DEVICE_END: 0xff7f,
});

const apuMask = [
  0x80, 0x3f, 0x00, 0xff, 0xbf, 0xff, 0x3f, 0x00, 0xff, 0xbf, 0x7f, 0xff, 0x9f, 0xff, 0xbf, 0xff,
  0xff, 0x00, 0x00, 0xbf, 0x00, 0x00, 0x70, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

export const createMemory = (cpu) => {
  const mem = new Uint8Array(MEM_SIZE);
  let rom = null;
  let mbc = null;
  let mbcType = 0;

  const reset = () => {
    mem.fill(0);

    mem[0xffff] = 0x00;
    mem[0xff47] = 0xfc;
    mem[0xff04] = 0x18;
  };

  const loadRomBank = (index) => {
    const dst = index ? 0x4000 : 0x0000;
    const src = index * BANK_SIZE;
    mem.set(rom.subarray(src, src + BANK_SIZE), dst);
  };

  const setRomData = (data) => {
    rom = data;
    mbcType = data[0x147];
    loadRomBank(0);
    mbc = createMBC(instance, mbcType);

    loadRomBank(1);
    if (mbc && cpu.getGameName && cpu.getRamSize) {
      mbc.loadRam(cpu.getGameName(), cpu.getRamSize());
    }
  };

  const vram = (addr) => {
    if (addr < addresses.VRAM_START || addr > addresses.VRAM_END)
      throw new Error(`VRAM out-of-bounds: ${addr.toString(16)}`);
    return mem[addr];
  };

  const oamram = (addr) => {
    if (addr < addresses.OAM_START || addr > addresses.OAM_END)
      throw new Error(`OAM out-of-bounds: ${addr.toString(16)}`);
    return mem[addr];
  };

  const deviceram = (addr, value) => {
    if (addr < addresses.DEVICE_START || addr > addresses.DEVICE_END)
      throw new Error(`IO out-of-bounds: ${addr.toString(16)}`);
    if (value === undefined) return mem[addr];
    mem[addr] = value;
  };

  const rb = (addr) => {
    if (addr >= 0xff10 && addr < 0xff40) {
      return mem[addr] | apuMask[addr - 0xff10];
    }

    if (addr >= 0xa000 && addr < 0xc000) {
      return mbc ? mbc.readRam(addr) : 0;
    }
    return mem[addr];
  };

  const wb = (addr, value) => {
    if (addr < 0x8000 || (addr >= 0xa000 && addr < 0xc000)) {
      if (mbc) mbc.manageWrite(addr, value);
      return;
    }

    if (addr >= 0xff10 && addr <= 0xff3f) {
      if (cpu.apu) cpu.apu.manageWrite(addr, value);
      return;
    }

    if (addr === 0xff00) {
      mem[addr] = (mem[addr] & 0x0f) | (value & 0x30);
      return;
    }

    mem[addr] = value;

    if ((addr & 0xff00) === 0xff00) {
      if (addr === 0xff02 && value & 0x80 && cpu.enableSerialTransfer) cpu.enableSerialTransfer();
      if (addr === 0xff04 && cpu.resetDivTimer) cpu.resetDivTimer();
      if (addr === 0xff46) dmaTransfer(value);
    }
  };

  const dmaTransfer = (highByte) => {
    const source = highByte << 8;
    mem.set(mem.subarray(source, source + 0xa0), addresses.OAM_START);
  };

  const instance = {
    mem,
    reset,
    setRomData,
    loadRomBank,
    vram,
    oamram,
    deviceram,
    rb,
    wb,
    addresses,
  };

  mbc = createMBC(instance, mbcType);

  return instance;
};

export default createMemory;
