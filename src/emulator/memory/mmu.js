import { bootRom, disableBootRom } from "@/constants/bootRom.js";
import cartridge from "@/constants/cartridge.js";
import { hram, oam, vram, wram } from "@/constants/memoryArrays.js";
import useBootRomStore from "@/stores/useBootRomStore.js";

export const read8 = (address) => {
  address &= 0xffff;

  const { bootActive } = useBootRomStore.getState();

  if (address < 0x0100 && bootActive) return bootRom[address];

  if (address < 0x8000) return cartridge.read(address);

  if (address < 0xa000) return vram[address - 0x8000];

  if (address < 0xc000) return cartridge.read(address);

  if (address < 0xe000) return wram[address - 0xc000];

  if (address < 0xfe00) return wram[address - 0xe000];

  if (address < 0xfea0) return oam[address - 0xfe00];

  if (address >= 0xff80 && address < 0xffff) return hram[address - 0xff80];

  if (address === 0xffff) return 0x00;

  return 0xff;
};

export const write8 = (addr, val) => {
  const address = addr & 0xffff;
  const value = val & 0xff;

  if (address < 0x8000) {
    cartridge.write(address, value);
    return;
  }
  if (address < 0xa000) {
    vram[address - 0x8000] = value;
    return;
  }
  if (address < 0xc000) {
    cartridge.write(address, value);
    return;
  }
  if (address < 0xe000) {
    wram[address - 0xc000] = value;
    return;
  }
  if (address < 0xfe00) {
    wram[address - 0xe000] = value;
    return;
  }
  if (address < 0xfea0) {
    oam[address - 0xfe00] = value;
    return;
  }
  if (address === 0xff50) {
    disableBootRom();
    return;
  }
  if (address >= 0xff80 && address < 0xffff) {
    hram[address - 0xff80] = value;
  }
};

export const read16 = (addr) => read8(addr) | (read8(addr + 1) << 8);

export const write16 = (addr, val) => {
  write8(addr, val & 0xff);
  write8(addr + 1, val >> 8);
};
