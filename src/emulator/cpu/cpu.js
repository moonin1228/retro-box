import { opcodeMap } from "@/emulator/cpu/opcodes.js";
import createTimer from "@/emulator/cpu/timer.js";
import { physics } from "@/emulator/display/screen.js";
import createMemory from "@/emulator/memory/memory.js";

const createCPU = (gameboy) => {
  const r = { A: 0, F: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0, pc: 0, sp: 0 };
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
    Object.assign(r, {
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

  const getRamSize = () => [0, 2, 8, 32][memory.rb(0x149)] * 1024 || 0;

  const getGameName = () => {
    let name = "";
    for (let i = 0x134; i < 0x143; i++) name += String.fromCharCode(memory.rb(i) || 32);
    return name;
  };

  const run = () => {
    r.pc = 0x0100;
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
          const IF = memory.rb(0xff0f);
          const IE = memory.rb(0xffff);
          const pendingInts = IF & IE & 0x1f;

          if (pendingInts) {
            if (isHalted) {
              isHalted = false;
              justWokeFromHalt = true;
              clock.c += 4;
            }

            for (let i = 0; i < 5; i++) {
              if (pendingInts & (1 << i)) {
                IME = false;

                memory.wb(0xff0f, IF & ~(1 << i));
                clock.c += 4;

                r.sp = (r.sp - 1) & 0xffff;
                memory.wb(r.sp, (r.pc >> 8) & 0xff);
                r.sp = (r.sp - 1) & 0xffff;
                memory.wb(r.sp, r.pc & 0xff);
                clock.c += 8;

                r.pc = 0x40 + i * 8;
                clock.c += 8;

                break;
              }
            }
            continue;
          }
        }

        if (isHalted) {
          clock.c += 4;

          const IF = memory.rb(0xff0f);
          const IE = memory.rb(0xffff);
          if (IF & IE & 0x1f) {
            isHalted = false;
            justWokeFromHalt = true;
            if (!IME) {
              r.pc = (r.pc - 1) & 0xffff;
            }
          }
        } else {
          const op = fetchOpcode();

          if (justWokeFromHalt) {
            justWokeFromHalt = false;
            clock.c += 4;
          }

          opcodeMap[op](instance);
          r.F &= 0xf0;
          if (op === 0xfb) {
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
    const op = memory.rb(r.pc);
    r.pc = (r.pc + 1) & 0xffff;
    if (op === undefined || op === null) {
      throw new Error(`Cannot read opcode at address ${r.pc.toString(16)}`);
    }
    if (!opcodeMap[op]) {
      throw new Error(`Unknown opcode ${op.toString(16)} @ ${r.pc.toString(16)}`);
    }
    return op;
  };

  const rr = (k) => r[k];
  const wr = (k, v) => {
    if (k === "pc" || k === "sp") {
      r[k] = v & 0xffff;
    } else {
      r[k] = v & 0xff;
    }
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
    memory.wb(0xff0f, memory.rb(0xff0f) | (1 << t));
  };

  const resetDivTimer = () => timer.resetDiv();

  Object.assign(
    instance,
    Object.freeze({
      r,
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
      rr,
      wr,
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
