import createMBC from "@/emulator/memory/mbc.js";

const MEMORY_SIZE = 0x10000;
const ROM_BANK_SIZE = 0x4000;

const ADDRESSES = Object.freeze({
  VRAM_START: 0x8000,
  VRAM_END: 0x9fff,
  EXTERNAL_RAM_START: 0xa000,
  EXTERNAL_RAM_END: 0xbfff,
  OAM_START: 0xfe00,
  OAM_END: 0xfe9f,
  DEVICE_START: 0xff00,
  DEVICE_END: 0xff7f,
});

const APU_REGISTER_MASK = [
  0x80, 0x3f, 0x00, 0xff, 0xbf, 0xff, 0x3f, 0x00, 0xff, 0xbf, 0x7f, 0xff, 0x9f, 0xff, 0xbf, 0xff,
  0xff, 0x00, 0x00, 0xbf, 0x00, 0x00, 0x70, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

const creatememoryory = (cpu) => {
  const memory = new Uint8Array(MEMORY_SIZE);
  let rom = null;
  let mbc = null;
  let mbcType = 0;

  const reset = () => {
    memory.fill(0);

    memory[0xffff] = 0x00;
    memory[0xff47] = 0xfc;
    memory[0xff04] = 0x18;
  };

  const loadRomBank = (index) => {
    const destination = index ? 0x4000 : 0x0000;
    const sourceOffset = index * ROM_BANK_SIZE;
    memory.set(rom.subarray(sourceOffset, sourceOffset + ROM_BANK_SIZE), destination);
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

  const vram = (address) => {
    if (address < ADDRESSES.VRAM_START || address > ADDRESSES.VRAM_END)
      throw new Error(`VRAM out-of-bounds: ${address.toString(16)}`);
    return memory[address];
  };

  const oamram = (address) => {
    if (address < ADDRESSES.OAM_START || address > ADDRESSES.OAM_END)
      throw new Error(`OAM out-of-bounds: ${address.toString(16)}`);
    return memory[address];
  };

  const deviceram = (address, value) => {
    if (address < ADDRESSES.DEVICE_START || address > ADDRESSES.DEVICE_END)
      throw new Error(`IO out-of-bounds: ${address.toString(16)}`);
    if (value === undefined) return memory[address];
    memory[address] = value;
  };

  const rb = (address) => {
    if (address === 0xff00) {
      const selector = memory[address] & 0x30;
      let inputBits = 0x0f;

      if (cpu.input && cpu.input.getInputMask) {
        const inputMask = cpu.input.getInputMask();

        if (selector === 0x20) {
          inputBits = ~inputMask & 0x0f;
        } else if (selector === 0x10) {
          inputBits = ~(inputMask >> 4) & 0x0f;
        }
      }

      return selector | inputBits;
    }

    if (address >= 0xff10 && address <= 0xff3f) {
      if (cpu.apu) {
        const value = cpu.apu.readRegister(address);
        if (value !== undefined) {
          return value | (APU_REGISTER_MASK[address - 0xff10] || 0xff);
        }
      }
      return memory[address] | (APU_REGISTER_MASK[address - 0xff10] || 0xff);
    }

    if (address >= 0xa000 && address < 0xc000) {
      return mbc ? mbc.readRam(address) : 0;
    }
    return memory[address];
  };

  const writeByte = (address, value) => {
    if (address < 0x8000 || (address >= 0xa000 && address < 0xc000)) {
      if (mbc) mbc.manageWrite(address, value);
      return;
    }

    if (address >= 0xff10 && address <= 0xff3f) {
      memory[address] = value;
      if (cpu.apu) {
        try {
          cpu.apu.writeRegister(address, value);
        } catch (error) {
          console.error(`Error writing to APU register ${address.toString(16)}:`, error);
        }
      }
      return;
    }

    if (address === 0xff00) {
      memory[address] = (memory[address] & 0x0f) | (value & 0x30);
      return;
    }

    memory[address] = value;

    if ((address & 0xff00) === 0xff00) {
      if (address === 0xff02 && value & 0x80 && cpu.enableSerialTransfer)
        cpu.enableSerialTransfer();
      if (address === 0xff04 && cpu.resetDivTimer) cpu.resetDivTimer();
      if (address === 0xff46) dmaTransfer(value);
    }
  };

  const dmaTransfer = (highByte) => {
    const source = highByte << 8;
    memory.set(memory.subarray(source, source + 0xa0), ADDRESSES.OAM_START);
  };

  const instance = {
    memory,
    reset,
    setRomData,
    loadRomBank,
    vram,
    oamram,
    deviceram,
    readByte: rb,
    writeByte,
    ADDRESSES,
  };

  mbc = createMBC(instance, mbcType);

  return instance;
};

export default creatememoryory;
