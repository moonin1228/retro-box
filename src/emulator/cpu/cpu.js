import { cpuOps } from "@/emulator/cpu/instructions.js";
import { opcodeMap } from "@/emulator/cpu/opcodes.js";
import createTimer from "@/emulator/cpu/timer.js";
import { physics } from "@/emulator/display/screen.js";
import createMemory from "@/emulator/memory/memory.js";
import Util from "@/emulator/util/util.js";

const createCPU = (gameboy, { useBootRom = false } = {}) => {
  const r = { A: 0, F: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0, pc: 0, sp: 0 };
  const clock = { c: 0, serial: 0 };

  let IME = false;
  let isHalted = false;
  let isPaused = false;
  const usingBootRom = useBootRom;

  let nextFrameTimer = null;

  const instance = {};

  const memory = createMemory(instance);
  const timer = createTimer(instance, memory);

  const INTERRUPTS = Object.freeze({
    VBLANK: 0,
    LCDC: 1,
    TIMER: 2,
    SERIAL: 3,
    HILO: 4,
  });

  const interruptRoutines = [
    (p) => cpuOps.RSTn(p, 0x40),
    (p) => cpuOps.RSTn(p, 0x48),
    (p) => cpuOps.RSTn(p, 0x50),
    (p) => cpuOps.RSTn(p, 0x58),
    (p) => cpuOps.RSTn(p, 0x60),
  ];

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
    r.pc = usingBootRom ? 0x0000 : 0x0100;
    console.log("CPU 시작 - PC:", r.pc.toString(16));
    frame();
  };
  const stop = () => clearTimeout(nextFrameTimer);

  const frame = () => {
    if (!isPaused) nextFrameTimer = setTimeout(frame, 1000 / physics.FREQUENCY);

    try {
      let vblank = false;
      while (!vblank) {
        const old = clock.c;

        if (!isHalted) {
          const op = fetchOpcode();
          opcodeMap[op](instance);
          r.F &= 0xf0;
        } else clock.c += 4;

        const elapsed = clock.c - old;
        vblank = instance.gpu ? instance.gpu.update(elapsed) : false;
        timer.update(elapsed);
        instance.input?.update?.();
        checkInterrupt();
      }
      clock.c = 0;
    } catch (err) {
      stop();
      gameboy?.handleException?.(err);
    }
  };

  const fetchOpcode = () => {
    const addr = r.pc & 0xffff;
    r.pc = (r.pc + 1) & 0xffff;
    const op = memory.rb(addr);
    if (op === undefined || op === null) {
      throw new Error(`Cannot read opcode at address ${addr.toString(16)}`);
    }
    if (!opcodeMap[op]) {
      throw new Error(`Unknown opcode ${op.toString(16)} @ ${addr.toString(16)}`);
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

  const isInterruptEnable = (t) => Util.readBit(memory.rb(0xffff), t) !== 0;
  const enableInterrupts = () => {
    IME = true;
  };
  const disableInterrupts = () => {
    IME = false;
  };

  const checkInterrupt = () => {
    if (!IME) return;
    let IFval = memory.rb(0xff0f);
    for (let i = 0; i < 5 && IME; i++) {
      if (Util.readBit(IFval, i) && isInterruptEnable(i)) {
        IFval &= ~(1 << i);
        memory.wb(0xff0f, IFval);
        disableInterrupts();
        clock.c += 4;
        interruptRoutines[i](instance);
      }
    }
  };

  const requestInterrupt = (t) => {
    memory.wb(0xff0f, memory.rb(0xff0f) | (1 << t));
    unhalt();
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
      disableInterrupts,
      resetDivTimer,
    }),
  );

  return instance;
};

export default createCPU;
