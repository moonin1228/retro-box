import {
  ADDRESSES,
  APU_REGISTER_MASK,
  MEMORY_SIZE,
  ROM_BANK_SIZE,
} from "@/constants/memoryConstants";
import createMBC from "@/emulator/memory/mbc";

interface InputDevice {
  getInputMask(): number;
}

interface APU {
  readRegister(address: number): number | undefined;
  writeRegister(address: number, value: number): void;
}

interface CPU {
  input?: InputDevice;
  apu?: APU;
  getGameName?(): string;
  getRamSize?(): number;
  enableSerialTransfer?(): void;
  resetDivTimer?(): void;
}

interface Mediator {
  getComponent<T = unknown>(name: string): T | undefined;
  publish(event: string, payload: unknown, source?: string): void;
  EVENTS: {
    memory: {
      romLoaded: string;
    };
  };
}

interface MBC {
  manageWrite(address: number, value: number): void;
  readRam(address: number): number;
  loadRam(gameName: string, ramSize: number): void;
  getState(): unknown;
  setState(state: unknown): void;
}

type CreateMBC = (memoryInstance: MemoryInstance, mbcType: number) => MBC | null;

export interface MemorySnapshot {
  memory: number[];
  mbcType: number;
  mbcState: unknown;
  romData: number[] | null;
}

export interface MemoryInstance {
  memory: Uint8Array;
  reset(): void;
  setRomData(data: Uint8Array): void;
  loadRomBank(index: number): void;
  getSnapshot(): MemorySnapshot;
  loadSnapshot(snapshot: MemorySnapshot | null | undefined): boolean;
  vram(address: number): number;
  oamram(address: number): number;
  ioRegister(address: number, value?: number): number | void;
  readByte(address: number): number;
  writeByte(address: number, value: number): void;
  ADDRESSES: typeof ADDRESSES;
}

function createMemory(mediator: Mediator): MemoryInstance {
  const memory = new Uint8Array(MEMORY_SIZE);
  let rom: Uint8Array | null = null;
  let mbc: MBC | null = null;
  let mbcType = 0;

  const instance = {} as MemoryInstance;

  function reset(): void {
    memory.fill(0);
    memory[0xffff] = 0x00;
    memory[0xff47] = 0xfc;
    memory[0xff04] = 0x18;
  }

  function loadRomBank(index: number): void {
    const destination = index ? 0x4000 : 0x0000;
    const sourceOffset = index * ROM_BANK_SIZE;
    if (!rom) return;
    memory.set(rom.subarray(sourceOffset, sourceOffset + ROM_BANK_SIZE), destination);
  }

  function setRomData(data: Uint8Array): void {
    rom = data;
    mbcType = data[0x147] ?? 0;
    loadRomBank(0);
    mbc = (createMBC as CreateMBC)(instance, mbcType);

    loadRomBank(1);

    const cpu = mediator.getComponent<CPU>("cpu");
    if (mbc && cpu?.getGameName && cpu?.getRamSize) {
      mbc.loadRam(cpu.getGameName(), cpu.getRamSize());
    }

    mediator.publish(
      mediator.EVENTS.memory.romLoaded,
      {
        size: data.length,
        mbcType,
        gameName: cpu?.getGameName?.() ?? "Unknown",
      },
      "memory",
    );
  }

  function vram(address: number): number {
    if (address < ADDRESSES.VRAM_START || address > ADDRESSES.VRAM_END) {
      throw new Error(`[MEMORY] VRAM 범위에 없습니다.: ${address.toString(16)}`);
    }
    return memory[address];
  }

  function oamram(address: number): number {
    if (address < ADDRESSES.OAM_START || address > ADDRESSES.OAM_END) {
      throw new Error(`[MEMORY] OAM 범위에 없습니다.: ${address.toString(16)}`);
    }
    return memory[address];
  }

  function ioRegister(address: number, value?: number): number | void {
    if (address < ADDRESSES.IO_REGISTER_START || address > ADDRESSES.IO_REGISTER_END) {
      throw new Error(`[MEMORY] IO 범위에 없습니다.: ${address.toString(16)}`);
    }
    if (value === undefined) return memory[address];
    memory[address] = value;
  }

  function readByte(address: number): number {
    if (address === 0xff00) {
      const selector = memory[address] & 0x30;
      let inputBits = 0x0f;

      const cpu = mediator.getComponent<CPU>("cpu");
      if (cpu?.input?.getInputMask) {
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
      const cpu = mediator.getComponent<CPU>("cpu");
      if (cpu?.apu) {
        const value = cpu.apu.readRegister(address);
        if (value !== undefined) {
          return value | (APU_REGISTER_MASK[address - 0xff10] ?? 0xff);
        }
      }
      return memory[address] | (APU_REGISTER_MASK[address - 0xff10] ?? 0xff);
    }

    if (address >= 0xa000 && address < 0xc000) {
      return mbc ? mbc.readRam(address) : 0;
    }

    if (address >= 0xe000 && address < 0xfe00) {
      return memory[address - 0x2000];
    }

    return memory[address];
  }

  function writeByte(address: number, value: number): void {
    if (address < 0x8000 || (address >= 0xa000 && address < 0xc000)) {
      if (mbc) mbc.manageWrite(address, value);
      return;
    }

    if (address >= 0xff10 && address <= 0xff3f) {
      memory[address] = value;
      const cpu = mediator.getComponent<CPU>("cpu");
      if (cpu?.apu) {
        try {
          cpu.apu.writeRegister(address, value);
        } catch (error) {
          console.error(`[MEMORY] APU 레지스터 쓰기 실패 ${address.toString(16)}:`, error);
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
      const cpu = mediator.getComponent<CPU>("cpu");
      if (address === 0xff02 && value & 0x80 && cpu?.enableSerialTransfer) {
        cpu.enableSerialTransfer();
      }
      if (address === 0xff04 && cpu?.resetDivTimer) {
        cpu.resetDivTimer();
      }
      if (address === 0xff46) {
        dmaTransfer(value);
      }
    }
  }

  function dmaTransfer(highByte: number): void {
    const source = highByte << 8;
    memory.set(memory.subarray(source, source + 0xa0), ADDRESSES.OAM_START);
  }

  function getSnapshot(): MemorySnapshot {
    return {
      memory: Array.from(memory),
      mbcType,
      mbcState: mbc ? mbc.getState() : null,
      romData: rom ? Array.from(rom) : null,
    };
  }

  function loadSnapshot(snapshot: MemorySnapshot | null | undefined): boolean {
    if (!snapshot) return false;

    memory.set(new Uint8Array(snapshot.memory));

    if (snapshot.romData) {
      rom = new Uint8Array(snapshot.romData);
      mbcType = snapshot.mbcType ?? 0;
      mbc = (createMBC as CreateMBC)(instance, mbcType);
      if (mbc && snapshot.mbcState != null) {
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

  mbc = (createMBC as CreateMBC)(instance, mbcType);

  return instance;
}

export default createMemory;
