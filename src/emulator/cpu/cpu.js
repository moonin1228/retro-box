import { opcodeMap } from "@/emulator/cpu/opcodes.js";
import createTimer from "@/emulator/cpu/timer.js";
import { physics } from "@/emulator/display/screen.js";
import createMemory from "@/emulator/memory/memory.js";

const createCPU = (gameboy) => {
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
  const clock = { c: 0, serial: 0 };

  let IME = false;
  let isHalted = false;
  let isPaused = false;
  let pendingInterruptEnable = false;
  let justWokeFromHalt = false;

  let nextFrameTimer = null;

  const instance = {};
  instance.imeDelay = false;

  const memory = createMemory(instance);
  const timer = createTimer(instance, memory);

  const INTERRUPTS = Object.freeze({
    VBLANK: 0,
    LCDC: 1,
    TIMER: 2,
    SERIAL: 3,
    HILO: 4,
  });

  const reset = () => {
    memory.reset();
    Object.assign(register, {
      A: 0x01,
      F: 0,
      B: 0xff,
      C: 0x13,
      D: 0,
      E: 0xc1,
      H: 0x84,
      L: 0x03,
      pc: 0,
      sp: 0xfffe,
    });
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
        const old = clock.c;

        if (IME && !pendingInterruptEnable) {
          const IF = memory.readByte(0xff0f);
          const IE = memory.readByte(0xffff);
          const pendingInterrupts = IF & IE & 0x1f;

          if (pendingInterrupts) {
            if (isHalted) {
              isHalted = false;
              justWokeFromHalt = true;
              clock.c += 4;
            }

            for (let i = 0; i < 5; i++) {
              if (pendingInterrupts & (1 << i)) {
                IME = false;

                memory.writeByte(0xff0f, IF & ~(1 << i));
                clock.c += 4;

                register.sp = (register.sp - 1) & 0xffff;
                memory.writeByte(register.sp, (register.pc >> 8) & 0xff);
                register.sp = (register.sp - 1) & 0xffff;
                memory.writeByte(register.sp, register.pc & 0xff);
                clock.c += 8;

                register.pc = 0x40 + i * 8;
                clock.c += 8;

                break;
              }
            }
            continue;
          }
        }

        if (isHalted) {
          clock.c += 4;

          const IF = memory.readByte(0xff0f);
          const IE = memory.readByte(0xffff);
          if (IF & IE & 0x1f) {
            isHalted = false;
            justWokeFromHalt = true;
            if (!IME) {
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
            clock.c += 4;
          } else if (pendingInterruptEnable) {
            IME = true;
            pendingInterruptEnable = false;
            clock.c += 4;
          }
        }

        const elapsed = clock.c - old;
        vblank = instance.gpu ? instance.gpu.update(elapsed) : false;
        timer.update(elapsed);
      }
      clock.c = 0;
    } catch (err) {
      stop();
      gameboy?.handleException?.(err);
    }
  };

  const fetchOpcode = () => {
    const op = memory.readByte(register.pc);
    register.pc = (register.pc + 1) & 0xffff;
    if (op === undefined || op === null) {
      throw new Error(`Cannot read opcode at address ${register.pc.toString(16)}`);
    }
    if (!opcodeMap[op]) {
      throw new Error(`Unknown opcode ${op.toString(16)} @ ${register.pc.toString(16)}`);
    }
    return op;
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
    IME = true;
  };

  const scheduleInterruptEnable = () => {
    pendingInterruptEnable = true;
  };

  const disableInterrupts = () => {
    IME = false;
    pendingInterruptEnable = false;
    justWokeFromHalt = false;
  };

  const requestInterrupt = (t) => {
    memory.writeByte(0xff0f, memory.readByte(0xff0f) | (1 << t));
  };

  const resetDivTimer = () => timer.resetDiv();

  Object.assign(
    instance,
    Object.freeze({
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
    }),
  );

  return instance;
};

export default createCPU;
