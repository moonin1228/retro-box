import UnimplementedException from "@/emulator/exception.js";
import createExtRam from "@/emulator/memory/extram.js";

const makeMBC = (spec) => Object.freeze(spec);

const createMBC0 = (memory) => {
  const extRam = createExtRam();

  const manageWrite = (addr, value) => {
    memory.loadRomBank(value);
    if (addr >= 0xa000 && addr < 0xc000) {
      extRam.write(addr - 0xa000, value);
      extRam.save();
    }
  };

  return makeMBC({
    manageWrite,
    readRam: (addr) => extRam.read(addr - 0xa000),
    loadRam: (game, size) => extRam.loadRam(game, size),
  });
};

const createMBC1 = (memory) => {
  const extRam = createExtRam();
  let romBankNumber = 1;
  let mode = 0;
  let ramEnabled = true;

  const manageWrite = (addr, value) => {
    switch (addr & 0xf000) {
      case 0x0000:
      case 0x1000:
        ramEnabled = !!(value & 0x0a);
        if (!ramEnabled) extRam.save();
        break;

      case 0x2000:
      case 0x3000: {
        value &= 0x1f;
        if (!value) value = 1;
        const mask = mode ? 0 : 0xe0;
        romBankNumber = (romBankNumber & mask) + value;
        memory.loadRomBank(romBankNumber);
        break;
      }

      case 0x4000:
      case 0x5000: {
        value &= 0x03;
        if (mode === 0) {
          romBankNumber = (romBankNumber & 0x1f) | (value << 5);
          memory.loadRomBank(romBankNumber);
        } else {
          extRam.setRamBank(value);
        }
        break;
      }

      case 0x6000:
      case 0x7000:
        mode = value & 1;
        break;

      case 0xa000:
      case 0xb000:
        extRam.write(addr - 0xa000, value);
        break;
    }
  };

  return makeMBC({
    manageWrite,
    readRam: (addr) => extRam.read(addr - 0xa000),
    loadRam: (game, size) => extRam.loadRam(game, size),
  });
};

const createMBC3 = (memory) => {
  const extRam = createExtRam();
  let romBankNumber = 1;
  let ramEnabled = true;

  const manageWrite = (addr, value) => {
    switch (addr & 0xf000) {
      case 0x0000:
      case 0x1000:
        ramEnabled = !!(value & 0x0a);
        if (!ramEnabled) extRam.save();
        break;

      case 0x2000:
      case 0x3000:
        value &= 0x7f;
        if (!value) value = 1;
        romBankNumber = value;
        memory.loadRomBank(romBankNumber);
        break;

      case 0x4000:
      case 0x5000:
        extRam.setRamBank(value);
        break;

      case 0x6000:
      case 0x7000:
        throw new UnimplementedException("", false);

      case 0xa000:
      case 0xb000:
        extRam.write(addr - 0xa000, value);
        break;
    }
  };

  return makeMBC({
    manageWrite,
    readRam: (addr) => extRam.read(addr - 0xa000),
    loadRam: (game, size) => extRam.loadRam(game, size),
  });
};

const createMBC5 = createMBC3;

const createMBC = (memory, type) => {
  switch (type) {
    case 0x00:
      return createMBC0(memory);
    case 0x01:
    case 0x02:
    case 0x03:
      return createMBC1(memory);
    case 0x0f:
    case 0x10:
    case 0x11:
    case 0x12:
    case 0x13:
      return createMBC3(memory);
    case 0x19:
    case 0x1a:
    case 0x1b:
    case 0x1c:
    case 0x1d:
    case 0x1e:
      return createMBC5(memory);
    default:
      throw new UnimplementedException("[MBC] 지원되지 않는 MBC 타입입니다.");
  }
};

export default createMBC;
