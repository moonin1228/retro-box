const MEMORY_ADDRESSES = {
  VRAM_START: 0x8000,
  VRAM_END: 0x9fff,
  EXTRAM_START: 0xa000,
  EXTRAM_END: 0xbfff,
  OAM_START: 0xfe00,
  OAM_END: 0xfe9f,
  DEVICE_START: 0xff00,
  DEVICE_END: 0xff7f,
};

const APU_MASK = [
  0x80, 0x3f, 0x00, 0xff, 0xbf, 0xff, 0x3f, 0x00, 0xff, 0xbf, 0x7f, 0xff, 0x9f, 0xff, 0xbf, 0xff,
  0xff, 0x00, 0x00, 0xbf, 0x00, 0x00, 0x70, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

const createInitialMemoryState = () => ({
  MEM_SIZE: 65536,
  MBCtype: 0,
  banksize: 0x4000,
  rom: null,
  mbc: null,
  cpu: null,
  data: new Array(65536).fill(0),
});

const resetMemoryRange = (memoryArray, start, end, value = 0) => {
  const newArray = [...memoryArray];
  for (let i = start; i <= end; i++) {
    newArray[i] = value;
  }
  return newArray;
};

const resetMemory = (state) => {
  let newData = [...state.data];

  newData = resetMemoryRange(newData, MEMORY_ADDRESSES.VRAM_START, MEMORY_ADDRESSES.VRAM_END);

  newData = resetMemoryRange(newData, MEMORY_ADDRESSES.DEVICE_START, MEMORY_ADDRESSES.DEVICE_END);

  newData[0xffff] = 0;
  newData[0xff47] = 0xfc;
  newData[0xff04] = 0x18;

  return {
    ...state,
    data: newData,
  };
};

const loadRomBankData = (memoryData, rom, index, banksize) => {
  const newData = [...memoryData];
  const start = index ? 0x4000 : 0x0;
  const romStart = index * 0x4000;

  for (let i = 0; i < banksize; i++) {
    newData[i + start] = rom[romStart + i];
  }

  return newData;
};

const isValidVramAddress = (address) =>
  address >= MEMORY_ADDRESSES.VRAM_START && address <= MEMORY_ADDRESSES.VRAM_END;

const isValidOamAddress = (address) =>
  address >= MEMORY_ADDRESSES.OAM_START && address <= MEMORY_ADDRESSES.OAM_END;

const isValidDeviceAddress = (address) =>
  address >= MEMORY_ADDRESSES.DEVICE_START && address <= MEMORY_ADDRESSES.DEVICE_END;

const readVram = (memoryData, address) => {
  if (!isValidVramAddress(address)) {
    throw new Error(`VRAM access in out of bounds address ${address}`);
  }
  return memoryData[address];
};

const readOamRam = (memoryData, address) => {
  if (!isValidOamAddress(address)) {
    throw new Error(`OAMRAM access in out of bounds address ${address}`);
  }
  return memoryData[address];
};

const accessDeviceRam = (memoryData, address, value) => {
  if (!isValidDeviceAddress(address)) {
    throw new Error(`Device RAM access in out of bounds address ${address}`);
  }

  if (typeof value === "undefined") {
    return { data: memoryData, value: memoryData[address] };
  }
  const newData = [...memoryData];
  newData[address] = value;
  return { data: newData, value };
};

const readByte = (state, addr) => {
  if (addr >= 0xff10 && addr < 0xff40) {
    const mask = APU_MASK[addr - 0xff10];
    return state.data[addr] | mask;
  }
  if (addr >= 0xa000 && addr < 0xc000) {
    return state.mbc.readRam(addr);
  }
  return state.data[addr];
};

const performDmaTransfer = (memoryData, startAddressPrefix) => {
  const newData = [...memoryData];
  const startAddress = startAddressPrefix << 8;

  for (let i = 0; i < 0xa0; i++) {
    newData[MEMORY_ADDRESSES.OAM_START + i] = newData[startAddress + i];
  }

  return newData;
};

const writeByte = (state, addr, value) => {
  const newState = { ...state };

  if (addr < 0x8000 || (addr >= 0xa000 && addr < 0xc000)) {
    state.mbc.manageWrite(addr, value);
  } else if (addr >= 0xff10 && addr <= 0xff3f) {
    state.cpu.apu.manageWrite(addr, value);
  } else if (addr === 0xff00) {
    newState.data = [...state.data];
    newState.data[addr] = (state.data[addr] & 0x0f) | (value & 0x30);
  } else {
    newState.data = [...state.data];
    newState.data[addr] = value;

    if ((addr & 0xff00) === 0xff00) {
      if (addr === 0xff02 && value & 0x80) {
        state.cpu.enableSerialTransfer();
      }
      if (addr === 0xff04) {
        state.cpu.resetDivTimer();
      }
      if (addr === 0xff46) {
        newState.data = performDmaTransfer(newState.data, value);
      }
    }
  }

  return newState;
};

const createMemory = (cpu) => {
  let state = {
    ...createInitialMemoryState(),
    cpu,
  };

  return {
    getState: () => state,
    getAddresses: () => MEMORY_ADDRESSES,
    reset: () => {
      state = resetMemory(state);
    },

    setRomData: (data) => {
      state.rom = data;
      state.data = loadRomBankData(state.data, state.rom, 0, state.banksize);
      state.data = loadRomBankData(state.data, state.rom, 1, state.banksize);
      state.mbc.loadRam(state.cpu.getGameName(), state.cpu.getRamSize());
    },

    loadRomBank: (index) => {
      state.data = loadRomBankData(state.data, state.rom, index, state.banksize);
    },

    vram: (address) => readVram(state.data, address),

    oamram: (address) => readOamRam(state.data, address),

    deviceram: (address, value) => {
      const result = accessDeviceRam(state.data, address, value);
      if (typeof value !== "undefined") {
        state.data = result.data;
      }
      return result.value;
    },

    rb: (addr) => readByte(state, addr),

    wb: (addr, value) => {
      state = writeByte(state, addr, value);
    },

    dmaTransfer: (startAddressPrefix) => {
      state.data = performDmaTransfer(state.data, startAddressPrefix);
    },
  };
};

export default createMemory;
