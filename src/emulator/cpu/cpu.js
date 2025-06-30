import { read8, read16, write8, write16 } from "@/emulator/memory/mmu.js";

export const FLAG_Z = 0x80;
export const FLAG_N = 0x40;
export const FLAG_H = 0x20;
export const FLAG_C = 0x10;

export const createGameBoyCPU = () => ({
  registers: {
    A: 0x01,
    F: 0xb0,
    B: 0x00,
    C: 0x13,
    D: 0x00,
    E: 0xd8,
    H: 0x01,
    L: 0x4d,
    PC: 0x0100,
    SP: 0xfffe,
  },

  cycles: 0,

  halted: false,
  interruptsEnabled: false,
});

export const read8Reg = (cpu, reg) => cpu.registers[reg] & 0xff;

export const write8Reg = (cpu, reg, value) => {
  if (reg === "F") {
    cpu.registers[reg] = value & 0xf0;
  } else {
    cpu.registers[reg] = value & 0xff;
  }
};

export const read16Reg = (cpu, regPair) => {
  switch (regPair) {
    case "BC":
      return (cpu.registers.B << 8) | cpu.registers.C;
    case "DE":
      return (cpu.registers.D << 8) | cpu.registers.E;
    case "HL":
      return (cpu.registers.H << 8) | cpu.registers.L;
    case "AF":
      return (cpu.registers.A << 8) | cpu.registers.F;
    case "SP":
      return cpu.registers.SP;
    case "PC":
      return cpu.registers.PC;
    default:
      throw new Error(`Unknown 16-bit register pair: ${regPair}`);
  }
};

export const write16Reg = (cpu, regPair, value) => {
  value &= 0xffff;
  switch (regPair) {
    case "BC":
      cpu.registers.B = (value >> 8) & 0xff;
      cpu.registers.C = value & 0xff;
      break;
    case "DE":
      cpu.registers.D = (value >> 8) & 0xff;
      cpu.registers.E = value & 0xff;
      break;
    case "HL":
      cpu.registers.H = (value >> 8) & 0xff;
      cpu.registers.L = value & 0xff;
      break;
    case "AF":
      cpu.registers.A = (value >> 8) & 0xff;
      cpu.registers.F = value & 0xf0;
      break;
    case "SP":
      cpu.registers.SP = value;
      break;
    case "PC":
      cpu.registers.PC = value;
      break;
    default:
      throw new Error(`Unknown 16-bit register pair: ${regPair}`);
  }
};

export const readMemory = (cpu, address) => read8(address);

export const writeMemory = (cpu, address, value) => write8(address, value);

export const readMemory16 = (cpu, address) => read16(address);

export const writeMemory16 = (cpu, address, value) => write16(address, value);

export const getFlag = (cpu, flag) => (cpu.registers.F & flag) !== 0;

export const setFlag = (cpu, flag, value) => {
  if (value) {
    cpu.registers.F |= flag;
  } else {
    cpu.registers.F &= ~flag;
  }
};

export const setFlags = (cpu, { z = null, n = null, h = null, c = null }) => {
  if (z !== null) setFlag(cpu, FLAG_Z, z);
  if (n !== null) setFlag(cpu, FLAG_N, n);
  if (h !== null) setFlag(cpu, FLAG_H, h);
  if (c !== null) setFlag(cpu, FLAG_C, c);
};

export const fetchByte = (cpu) => {
  const value = readMemory(cpu, cpu.registers.PC);
  cpu.registers.PC = (cpu.registers.PC + 1) & 0xffff;
  return value;
};

export const fetchWord = (cpu) => {
  const lo = fetchByte(cpu);
  const hi = fetchByte(cpu);
  return (hi << 8) | lo;
};

export const pushByte = (cpu, value) => {
  cpu.registers.SP = (cpu.registers.SP - 1) & 0xffff;
  writeMemory(cpu, cpu.registers.SP, value);
};

export const popByte = (cpu) => {
  const value = readMemory(cpu, cpu.registers.SP);
  cpu.registers.SP = (cpu.registers.SP + 1) & 0xffff;
  return value;
};

export const pushWord = (cpu, value) => {
  pushByte(cpu, (value >> 8) & 0xff);
  pushByte(cpu, value & 0xff);
};

export const popWord = (cpu) => {
  const lo = popByte(cpu);
  const hi = popByte(cpu);
  return (hi << 8) | lo;
};

export const testCondition = (cpu, condition) => {
  switch (condition) {
    case "NZ":
      return !getFlag(cpu, FLAG_Z);
    case "Z":
      return getFlag(cpu, FLAG_Z);
    case "NC":
      return !getFlag(cpu, FLAG_C);
    case "C":
      return getFlag(cpu, FLAG_C);
    default:
      throw new Error(`Unknown condition: ${condition}`);
  }
};

export const halt = (cpu) => {
  cpu.halted = true;
};

export const enableInterrupts = (cpu) => {
  cpu.interruptsEnabled = true;
};

export const disableInterrupts = (cpu) => {
  cpu.interruptsEnabled = false;
};

export const addCycles = (cpu, cycles) => {
  cpu.cycles += cycles;
};

export const dumpState = (cpu) => ({
  registers: { ...cpu.registers },
  cycles: cpu.cycles,
  halted: cpu.halted,
  interruptsEnabled: cpu.interruptsEnabled,
  flags: {
    Z: getFlag(cpu, FLAG_Z),
    N: getFlag(cpu, FLAG_N),
    H: getFlag(cpu, FLAG_H),
    C: getFlag(cpu, FLAG_C),
  },
});

export const cpu = createGameBoyCPU();
