import {
  addCycles,
  disableInterrupts,
  enableInterrupts,
  fetchByte,
  fetchWord,
  halt,
  popWord,
  pushWord,
  read8Reg,
  read16Reg,
  readMemory,
  setFlags,
  testCondition,
  write8Reg,
  write16Reg,
} from "@/emulator/cpu/cpu.js";

export const InstructionList = {
  LD_r_n(cpu, reg) {
    const value = fetchByte(cpu);
    write8Reg(cpu, reg, value);
    addCycles(cpu, 8);
  },

  INC_r(cpu, reg) {
    const value = read8Reg(cpu, reg);
    const result = (value + 1) & 0xff;

    write8Reg(cpu, reg, result);
    setFlags(cpu, {
      z: result === 0,
      n: false,
      h: (value & 0x0f) === 0x0f,
    });
    addCycles(cpu, 4);
  },

  DEC_r(cpu, reg) {
    const value = read8Reg(cpu, reg);
    const result = (value - 1) & 0xff;

    write8Reg(cpu, reg, result);
    setFlags(cpu, {
      z: result === 0,
      n: true,
      h: (value & 0x0f) === 0x00,
    });
    addCycles(cpu, 4);
  },

  SUB_A_r(cpu, reg) {
    const a = read8Reg(cpu, "A");
    const value = read8Reg(cpu, reg);
    const result = (a - value) & 0xff;

    write8Reg(cpu, "A", result);
    setFlags(cpu, {
      z: result === 0,
      n: true,
      h: (a & 0x0f) < (value & 0x0f),
      c: a < value,
    });
    addCycles(cpu, 4);
  },

  SUB_A_n(cpu) {
    const a = read8Reg(cpu, "A");
    const value = fetchByte(cpu);
    const result = (a - value) & 0xff;

    write8Reg(cpu, "A", result);
    setFlags(cpu, {
      z: result === 0,
      n: true,
      h: (a & 0x0f) < (value & 0x0f),
      c: a < value,
    });
    addCycles(cpu, 8);
  },

  SUB_A_HL(cpu) {
    const a = read8Reg(cpu, "A");
    const address = read16Reg(cpu, "HL");
    const value = readMemory(cpu, address);
    const result = (a - value) & 0xff;

    write8Reg(cpu, "A", result);
    setFlags(cpu, {
      z: result === 0,
      n: true,
      h: (a & 0x0f) < (value & 0x0f),
      c: a < value,
    });
    addCycles(cpu, 8);
  },

  JP_nn(cpu) {
    const address = fetchWord(cpu);
    write16Reg(cpu, "PC", address);
    addCycles(cpu, 16);
  },

  JP_cc_nn(cpu, condition) {
    const address = fetchWord(cpu);
    if (testCondition(cpu, condition)) {
      write16Reg(cpu, "PC", address);
      addCycles(cpu, 16);
    } else {
      addCycles(cpu, 12);
    }
  },

  CALL_nn(cpu) {
    const address = fetchWord(cpu);
    pushWord(cpu, read16Reg(cpu, "PC"));
    write16Reg(cpu, "PC", address);
    addCycles(cpu, 24);
  },

  CALL_cc_nn(cpu, condition) {
    const address = fetchWord(cpu);
    if (testCondition(cpu, condition)) {
      pushWord(cpu, read16Reg(cpu, "PC"));
      write16Reg(cpu, "PC", address);
      addCycles(cpu, 24);
    } else {
      addCycles(cpu, 12);
    }
  },

  RET(cpu) {
    const address = popWord(cpu);
    write16Reg(cpu, "PC", address);
    addCycles(cpu, 16);
  },

  RET_cc(cpu, condition) {
    if (testCondition(cpu, condition)) {
      const address = popWord(cpu);
      write16Reg(cpu, "PC", address);
      addCycles(cpu, 20);
    } else {
      addCycles(cpu, 8);
    }
  },

  RST_n(cpu, address) {
    pushWord(cpu, read16Reg(cpu, "PC"));
    write16Reg(cpu, "PC", address);
    addCycles(cpu, 16);
  },

  NOP(cpu) {
    addCycles(cpu, 4);
  },

  HALT(cpu) {
    halt(cpu);
    addCycles(cpu, 4);
  },

  DI(cpu) {
    disableInterrupts(cpu);
    addCycles(cpu, 4);
  },

  EI(cpu) {
    enableInterrupts(cpu);
    addCycles(cpu, 4);
  },

  ADD_A_r(cpu, reg) {
    const a = read8Reg(cpu, "A");
    const value = read8Reg(cpu, reg);
    const result = a + value;

    write8Reg(cpu, "A", result & 0xff);
    setFlags(cpu, {
      z: (result & 0xff) === 0,
      n: false,
      h: (a & 0x0f) + (value & 0x0f) > 0x0f,
      c: result > 0xff,
    });
    addCycles(cpu, 4);
  },

  JR_n(cpu) {
    const offset = fetchByte(cpu);
    const signedOffset = offset > 127 ? offset - 256 : offset;
    const currentPC = read16Reg(cpu, "PC");
    const newPC = (currentPC + signedOffset) & 0xffff;

    write16Reg(cpu, "PC", newPC);
    addCycles(cpu, 12);
  },
};
