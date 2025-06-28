const memory = new Uint8Array(0x10000);

export function read8(address) {
  return memory[address];
}

export function write8(address, value) {
  memory[address] = value;
}

export function read16(address) {
  const low = memory[address];
  const high = memory[address + 1];
  return (high << 8) | low;
}

export function write16(address, value) {
  memory[address] = value & 0xff;
  memory[address + 1] = (value >> 8) & 0xff;
}
