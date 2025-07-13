import {
  ADDRESSES,
  APU_REGISTER_MASK,
  MEMORY_SIZE,
  ROM_BANK_SIZE,
} from "@/constants/memoryConstants.js";
import createMBC from "@/emulator/memory/mbc.js";

const createMemory = (mediator) => {
  const memory = new Uint8Array(MEMORY_SIZE);
  let rom = null;
  let mbc = null;
  let mbcType = 0;
  const instance = {};

  function reset() {
    memory.fill(0);

    memory[0xffff] = 0x00;
    memory[0xff47] = 0xfc;
    memory[0xff04] = 0x18;
  }

  function loadRomBank(index) {
    const destination = index ? 0x4000 : 0x0000;
    const sourceOffset = index * ROM_BANK_SIZE;
    memory.set(rom.subarray(sourceOffset, sourceOffset + ROM_BANK_SIZE), destination);
  }

  function setRomData(data) {
    rom = data;
    mbcType = data[0x147];
    loadRomBank(0);
    mbc = createMBC(instance, mbcType);

    loadRomBank(1);
    const cpu = mediator.getComponent("cpu");
    if (mbc && cpu?.getGameName && cpu?.getRamSize) {
      mbc.loadRam(cpu.getGameName(), cpu.getRamSize());
    }
  }

  function vram(address) {
    if (address < ADDRESSES.VRAM_START || address > ADDRESSES.VRAM_END)
      throw new Error(`[MEMORY] VRAM 범위에 없습니다.: ${address.toString(16)}`);
    return memory[address];
  }

  function oamram(address) {
    if (address < ADDRESSES.OAM_START || address > ADDRESSES.OAM_END)
      throw new Error(`[MEMORY] OAM 범위에 없습니다.: ${address.toString(16)}`);
    return memory[address];
  }

  function ioRegister(address, value) {
    if (address < ADDRESSES.IO_REGISTER_START || address > ADDRESSES.IO_REGISTER_END)
      throw new Error(`[MEMORY] IO 범위에 없습니다.: ${address.toString(16)}`);
    if (value === undefined) return memory[address];
    memory[address] = value;
  }

  function readByte(address) {
    if (address === 0xff00) {
      const selector = memory[address] & 0x30;
      let inputBits = 0x0f;

      const cpu = mediator.getComponent("cpu");
      if (cpu?.input && cpu.input.getInputMask) {
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
      const cpu = mediator.getComponent("cpu");
      if (cpu?.apu) {
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

    if (address >= 0xe000 && address < 0xfe00) {
      return memory[address - 0x2000];
    }

    return memory[address];
  }

  function writeByte(address, value) {
    if (address < 0x8000 || (address >= 0xa000 && address < 0xc000)) {
      if (mbc) mbc.manageWrite(address, value);
      return;
    }

    if (address >= 0xff10 && address <= 0xff3f) {
      memory[address] = value;
      const cpu = mediator.getComponent("cpu");
      if (cpu?.apu) {
        try {
          cpu.apu.writeRegister(address, value);
        } catch (error) {
          console.error(
            `[MEMORY]APU 레지스터에 쓰는 것을 실패했습니다. ${address.toString(16)}:`,
            error,
          );
        }
      }
      return;
    }

    if (address === 0xff00) {
      memory[address] = (memory[address] & 0x0f) | (value & 0x30);
      return;
    }

    if (address >= 0xe000 && address < 0xfe00) {
      memory[address - 0x2000] = value;
    }

    memory[address] = value;

    if ((address & 0xff00) === 0xff00) {
      const cpu = mediator.getComponent("cpu");
      if (address === 0xff02 && value & 0x80 && cpu?.enableSerialTransfer)
        cpu.enableSerialTransfer();
      if (address === 0xff04 && cpu?.resetDivTimer) cpu.resetDivTimer();
      if (address === 0xff46) dmaTransfer(value);
    }
  }

  function dmaTransfer(highByte) {
    const source = highByte << 8;
    memory.set(memory.subarray(source, source + 0xa0), ADDRESSES.OAM_START);
  }

  function getSnapshot() {
    return {
      memory: Array.from(memory),
      mbcType,
      mbcState: mbc ? mbc.getState() : null,
      romData: rom ? Array.from(rom) : null,
    };
  }

  function loadSnapshot(snapshot) {
    if (!snapshot) return false;

    memory.set(new Uint8Array(snapshot.memory));

    if (snapshot.romData) {
      rom = new Uint8Array(snapshot.romData);
      mbcType = snapshot.mbcType;
      mbc = createMBC(instance, mbcType);
      if (mbc && snapshot.mbcState) {
        mbc.setState(snapshot.mbcState);
      }
    }

    return true;
  }

  Object.assign(instance, {
    memory,
    reset,
    setRomData,
    loadRomBank,
    getSnapshot,
    loadSnapshot,
    vram,
    oamram,
    ioRegister,
    readByte,
    writeByte,
    ADDRESSES,
  });

  mbc = createMBC(instance, mbcType);

  return instance;
};

export default createMemory;
