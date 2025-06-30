import { InstructionList } from "@/emulator/cpu/instructions.js";

export const opcodeTable = new Array(256).fill(null);

opcodeTable[0x00] = (cpu) => InstructionList.NOP(cpu);

opcodeTable[0x06] = (cpu) => InstructionList.LD_r_n(cpu, "B");
opcodeTable[0x0e] = (cpu) => InstructionList.LD_r_n(cpu, "C");
opcodeTable[0x16] = (cpu) => InstructionList.LD_r_n(cpu, "D");
opcodeTable[0x1e] = (cpu) => InstructionList.LD_r_n(cpu, "E");
opcodeTable[0x26] = (cpu) => InstructionList.LD_r_n(cpu, "H");
opcodeTable[0x2e] = (cpu) => InstructionList.LD_r_n(cpu, "L");
opcodeTable[0x3e] = (cpu) => InstructionList.LD_r_n(cpu, "A");

opcodeTable[0x90] = (cpu) => InstructionList.SUB_A_r(cpu, "B");
opcodeTable[0x91] = (cpu) => InstructionList.SUB_A_r(cpu, "C");
opcodeTable[0x92] = (cpu) => InstructionList.SUB_A_r(cpu, "D");
opcodeTable[0x94] = (cpu) => InstructionList.SUB_A_r(cpu, "H");
opcodeTable[0x95] = (cpu) => InstructionList.SUB_A_r(cpu, "L");
opcodeTable[0x96] = (cpu) => InstructionList.SUB_A_HL(cpu);
opcodeTable[0x97] = (cpu) => InstructionList.SUB_A_r(cpu, "A");

opcodeTable[0xd6] = (cpu) => InstructionList.SUB_A_n(cpu);

opcodeTable[0xc3] = (cpu) => InstructionList.JP_nn(cpu);

opcodeTable[0xc2] = (cpu) => InstructionList.JP_cc_nn(cpu, "NZ");
opcodeTable[0xca] = (cpu) => InstructionList.JP_cc_nn(cpu, "Z");
opcodeTable[0xd2] = (cpu) => InstructionList.JP_cc_nn(cpu, "NC");
opcodeTable[0xda] = (cpu) => InstructionList.JP_cc_nn(cpu, "C");

opcodeTable[0xcd] = (cpu) => InstructionList.CALL_nn(cpu);

opcodeTable[0xc4] = (cpu) => InstructionList.CALL_cc_nn(cpu, "NZ");
opcodeTable[0xcc] = (cpu) => InstructionList.CALL_cc_nn(cpu, "Z");
opcodeTable[0xd4] = (cpu) => InstructionList.CALL_cc_nn(cpu, "NC");
opcodeTable[0xdc] = (cpu) => InstructionList.CALL_cc_nn(cpu, "C");

opcodeTable[0xc9] = (cpu) => InstructionList.RET(cpu);

opcodeTable[0xc0] = (cpu) => InstructionList.RET_cc(cpu, "NZ");
opcodeTable[0xc8] = (cpu) => InstructionList.RET_cc(cpu, "Z");
opcodeTable[0xd0] = (cpu) => InstructionList.RET_cc(cpu, "NC");
opcodeTable[0xd8] = (cpu) => InstructionList.RET_cc(cpu, "C");

opcodeTable[0xc7] = (cpu) => InstructionList.RST_n(cpu, 0x00);
opcodeTable[0xcf] = (cpu) => InstructionList.RST_n(cpu, 0x08);
opcodeTable[0xd7] = (cpu) => InstructionList.RST_n(cpu, 0x10);
opcodeTable[0xdf] = (cpu) => InstructionList.RST_n(cpu, 0x18);
opcodeTable[0xe7] = (cpu) => InstructionList.RST_n(cpu, 0x20);
opcodeTable[0xef] = (cpu) => InstructionList.RST_n(cpu, 0x28);
opcodeTable[0xf7] = (cpu) => InstructionList.RST_n(cpu, 0x30);
opcodeTable[0xff] = (cpu) => InstructionList.RST_n(cpu, 0x38);

opcodeTable[0x76] = (cpu) => InstructionList.HALT(cpu);

opcodeTable[0xf3] = (cpu) => InstructionList.DI(cpu);
opcodeTable[0xfb] = (cpu) => InstructionList.EI(cpu);

opcodeTable[0x04] = (cpu) => InstructionList.INC_r(cpu, "B");
opcodeTable[0x0c] = (cpu) => InstructionList.INC_r(cpu, "C");
opcodeTable[0x14] = (cpu) => InstructionList.INC_r(cpu, "D");
opcodeTable[0x1c] = (cpu) => InstructionList.INC_r(cpu, "E");
opcodeTable[0x24] = (cpu) => InstructionList.INC_r(cpu, "H");
opcodeTable[0x2c] = (cpu) => InstructionList.INC_r(cpu, "L");
opcodeTable[0x3c] = (cpu) => InstructionList.INC_r(cpu, "A");

opcodeTable[0x05] = (cpu) => InstructionList.DEC_r(cpu, "B");
opcodeTable[0x0d] = (cpu) => InstructionList.DEC_r(cpu, "C");
opcodeTable[0x15] = (cpu) => InstructionList.DEC_r(cpu, "D");
opcodeTable[0x1d] = (cpu) => InstructionList.DEC_r(cpu, "E");
opcodeTable[0x25] = (cpu) => InstructionList.DEC_r(cpu, "H");
opcodeTable[0x2d] = (cpu) => InstructionList.DEC_r(cpu, "L");
opcodeTable[0x3d] = (cpu) => InstructionList.DEC_r(cpu, "A");

opcodeTable[0x80] = (cpu) => InstructionList.ADD_A_r(cpu, "B");
opcodeTable[0x81] = (cpu) => InstructionList.ADD_A_r(cpu, "C");
opcodeTable[0x82] = (cpu) => InstructionList.ADD_A_r(cpu, "D");
opcodeTable[0x83] = (cpu) => InstructionList.ADD_A_r(cpu, "E");
opcodeTable[0x84] = (cpu) => InstructionList.ADD_A_r(cpu, "H");
opcodeTable[0x85] = (cpu) => InstructionList.ADD_A_r(cpu, "L");
opcodeTable[0x87] = (cpu) => InstructionList.ADD_A_r(cpu, "A");

opcodeTable[0x18] = (cpu) => InstructionList.JR_n(cpu);

export const executeOpcode = (cpu, opcode) => {
  const handler = opcodeTable[opcode];
  if (handler) {
    handler(cpu);
  } else {
    throw new Error(`Unimplemented opcode: 0x${opcode.toString(16).padStart(2, "0")}`);
  }
};

export const getOpcodesList = () => {
  const implemented = [];
  for (let i = 0; i < 256; i++) {
    if (opcodeTable[i] !== null) {
      implemented.push(`0x${i.toString(16).padStart(2, "0")}`);
    }
  }
  return implemented;
};

export const getOpcodeProgress = () => {
  const implemented = getOpcodesList();
  return {
    implemented: implemented.length,
    total: 256,
    percentage: Math.round((implemented.length / 256) * 100),
    opcodes: implemented,
  };
};
