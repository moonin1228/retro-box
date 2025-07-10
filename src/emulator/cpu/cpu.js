import { INITIAL_REGISTER, INTERRUPTS } from "@/constants/cpuConstants.js";
import { opcodeMap } from "@/emulator/cpu/opcodes.js";
import createTimer from "@/emulator/cpu/timer.js";
import { physics } from "@/emulator/display/screen.js";
import createMemory from "@/emulator/memory/memory.js";

const createCPU = (gameboy) => {
  const instance = {};
  const register = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
    H: 0,
    L: 0,
    pc: 0,
    sp: 0,
  };
  const clock = { cycles: 0, serial: 0 };

  let isInterruptMasterEnabled = false;
  let isHalted = false;
  let isPaused = false;
  let pendingInterruptEnable = false;
  let justWokeFromHalt = false;

  let nextFrameTimer = null;

  instance.imeDelay = false;

  const memory = createMemory(instance);
  const timer = createTimer(instance, memory);

  const reset = () => {
    memory.reset();
    Object.assign(register, INITIAL_REGISTER);
  };

  const loadRom = (data) => memory.setRomData(data);

  const getRamSize = () => [0, 2, 8, 32][memory.readByte(0x149)] * 1024 || 0;

  const getGameName = () => {
    let name = "";
    for (let i = 0x134; i < 0x143; i++) name += String.fromCharCode(memory.readByte(i) || 32);
    return name;
  };

  const run = () => {
    register.pc = 0x0100;
    frame();
  };
  const stop = () => clearTimeout(nextFrameTimer);

  const frame = () => {
    if (!isPaused) nextFrameTimer = setTimeout(frame, 1000 / physics.FREQUENCY);

    try {
      let vblank = false;
      while (!vblank) {
        const old = clock.cycles;

        if (isInterruptMasterEnabled && !pendingInterruptEnable) {
          const IF = memory.readByte(0xff0f);
          const IE = memory.readByte(0xffff);
          const pendingInterrupts = IF & IE & 0x1f;

          if (pendingInterrupts) {
            if (isHalted) {
              isHalted = false;
              justWokeFromHalt = true;
              clock.cycles += 4;
            }

            for (let i = 0; i < 5; i++) {
              if (pendingInterrupts & (1 << i)) {
                isInterruptMasterEnabled = false;

                memory.writeByte(0xff0f, IF & ~(1 << i));
                clock.cycles += 4;

                register.sp = (register.sp - 1) & 0xffff;
                memory.writeByte(register.sp, (register.pc >> 8) & 0xff);
                register.sp = (register.sp - 1) & 0xffff;
                memory.writeByte(register.sp, register.pc & 0xff);
                clock.cycles += 8;

                register.pc = 0x40 + i * 8;
                clock.cycles += 8;

                break;
              }
            }
            continue;
          }
        }

        if (isHalted) {
          clock.cycles += 4;

          const IF = memory.readByte(0xff0f);
          const IE = memory.readByte(0xffff);
          if (IF & IE & 0x1f) {
            isHalted = false;
            justWokeFromHalt = true;
            if (!isInterruptMasterEnabled) {
              register.pc = (register.pc - 1) & 0xffff;
            }
          }
        } else {
          const currentOpcode = fetchOpcode();

          if (justWokeFromHalt) {
            justWokeFromHalt = false;
            clock.c += 4;
          }

          opcodeMap[currentOpcode](instance);
          register.F &= 0xf0;
          if (currentOpcode === 0xfb) {
            pendingInterruptEnable = true;
            clock.cycles += 4;
          } else if (pendingInterruptEnable) {
            isInterruptMasterEnabled = true;
            pendingInterruptEnable = false;
            clock.cycles += 4;
          }
        }

        const elapsed = clock.cycles - old;
        vblank = instance.gpu ? instance.gpu.update(elapsed) : false;
        timer.update(elapsed);
      }
      clock.cycles = 0;
    } catch (err) {
      stop();
      gameboy?.handleException?.(err);
    }
  };

  const fetchOpcode = () => {
    const opcode = memory.readByte(register.pc);
    register.pc = (register.pc + 1) & 0xffff;
    if (opcode === undefined || opcode === null) {
      throw new Error(`[CPU] 이 주소에 opcode를 읽을 수 없습니다. ${register.pc.toString(16)}`);
    }
    if (!opcodeMap[opcode]) {
      throw new Error(`[CPU]없는 opcode입니다. ${opcode.toString(16)} ${register.pc.toString(16)}`);
    }
    return opcode;
  };

  const getRegister = (k) => register[k];
  const setRegister = (reg, val) => {
    register[reg] = val & 0xff;
    if (reg === "sp" || reg === "pc") register[reg] = val & 0xffff;
  };

  const halt = () => {
    isHalted = true;
  };
  const unhalt = () => {
    isHalted = false;
  };
  const pause = () => {
    isPaused = true;
  };
  const unpause = () => {
    if (isPaused) {
      isPaused = false;
      frame();
    }
  };

  const enableInterrupts = () => {
    isInterruptMasterEnabled = true;
  };

  const scheduleInterruptEnable = () => {
    pendingInterruptEnable = true;
  };

  const disableInterrupts = () => {
    isInterruptMasterEnabled = false;
    pendingInterruptEnable = false;
    justWokeFromHalt = false;
  };

  const requestInterrupt = (t) => {
    memory.writeByte(0xff0f, memory.readByte(0xff0f) | (1 << t));
  };

  const resetDivTimer = () => timer.resetDiv();

  Object.assign(instance, {
    instance,
    register,
    clock,
    memory,
    timer,
    INTERRUPTS,
    reset,
    loadRom,
    getRamSize,
    getGameName,
    run,
    stop,
    pause,
    unpause,
    getRegister,
    setRegister,
    halt,
    unhalt,
    requestInterrupt,
    enableInterrupts,
    scheduleInterruptEnable,
    disableInterrupts,
    resetDivTimer,
  });

  return instance;
};

export default createCPU;
