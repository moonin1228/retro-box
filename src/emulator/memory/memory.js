const memory = new Uint8Array(0x10000);

export const read8 = (address) => memory[address];

export const write8 = (address, value) => {
  memory[address] = value;
};

export const read16 = (address) => {
  const low = memory[address];
  const high = memory[address + 1];
  return (high << 8) | low;
};

export const write16 = (address, value) => {
  memory[address] = value & 0xff;
  memory[address + 1] = (value >> 8) & 0xff;
};
