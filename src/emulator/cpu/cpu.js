import { INITIAL_REGISTER, INTERRUPTS } from "@/constants/cpuConstants.js";
import { opcodeMap } from "@/emulator/cpu/opcodes.js";
import { physics } from "@/emulator/display/screen.js";

function createCPU(mediator) {
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
  const clock = { cycles: 0 };

  let isInterruptMasterEnabled = false;
  let isHalted = false;
  let isPaused = false;
  let isPendingInterruptEnable = false;
  let isJustWokeFromHalt = false;

  let nextFrameTimer = null;

  instance.imeDelay = false;

  const memory = mediator.getComponent("memory");

  function reset() {
    memory.reset();
    Object.assign(register, INITIAL_REGISTER);
  }

  async function loadRom(data) {
    let gameTitle = "";
    memory.setRomData(data);
    gameTitle = await getGameName();
  }

  function getRamSize() {
    const ramSizeCode = memory.readByte(0x149);
    const sizeKB = [0, 2, 8, 32][ramSizeCode] || 0;
    return sizeKB * 1024;
  }

  function getGameName() {
    let name = "";
    for (let i = 0x134; i < 0x143; i++) name += String.fromCharCode(memory.readByte(i) || 32);
    return name;
  }

  function run() {
    register.pc = 0x0100;
    frame();
  }

  function stop() {
    clearTimeout(nextFrameTimer);
  }

  function frame() {
    if (!isPaused) nextFrameTimer = setTimeout(frame, 1000 / physics.FREQUENCY);

    try {
      let vblank = false;
      let cycleCount = 0;
      const MAX_CYCLES = 70224;

      while (!vblank && cycleCount < MAX_CYCLES) {
        const old = clock.cycles;

        if (isInterruptMasterEnabled && !isPendingInterruptEnable) {
          const IF = memory.readByte(0xff0f);
          const IE = memory.readByte(0xffff);
          const pendingInterrupts = IF & IE & 0x1f;

          if (pendingInterrupts) {
            if (isHalted) {
              isHalted = false;
              isJustWokeFromHalt = true;
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
          if (IF & IE & 0x12f) {
            isHalted = false;
            isJustWokeFromHalt = true;
            if (!isInterruptMasterEnabled) {
              register.pc = (register.pc - 1) & 0xffff;
            }
          }
        } else {
          const currentOpcode = fetchOpcode();

          if (isJustWokeFromHalt) {
            isJustWokeFromHalt = false;
            clock.c += 4;
          }

          opcodeMap[currentOpcode](instance);
          register.F &= 0xf0;
          if (currentOpcode === 0xfb) {
            isPendingInterruptEnable = true;
            clock.cycles += 4;
          } else if (isPendingInterruptEnable) {
            isInterruptMasterEnabled = true;
            isPendingInterruptEnable = false;
            clock.cycles += 4;
          }
        }

        const elapsedCycles = clock.cycles - old;

        const gpu = mediator.getComponent("gpu");
        vblank = gpu ? gpu.update(elapsedCycles) : false;
        const timer = mediator.getComponent("timer");
        if (timer) timer.update(elapsedCycles);

        cycleCount += elapsedCycles;

        if (!gpu) {
          vblank = true;
        }
      }
      clock.cycles = 0;

      mediator.publish(
        mediator.EVENTS.cpu.frameComplete,
        {
          frameCount: cycleCount,
        },
        "cpu",
      );
    } catch (error) {
      stop();
    }
  }

  function fetchOpcode() {
    const opcode = memory.readByte(register.pc);
    register.pc = (register.pc + 1) & 0xffff;
    if (opcode === undefined || opcode === null) {
      throw new Error(`[CPU] 이 주소에 opcode를 읽을 수 없습니다. ${register.pc.toString(16)}`);
    }
    if (!opcodeMap[opcode]) {
      throw new Error(`[CPU]없는 opcode입니다. ${opcode.toString(16)} ${register.pc.toString(16)}`);
    }
    return opcode;
  }

  function setRegister(registerName, value) {
    register[registerName] = value & 0xff;
    if (registerName === "sp" || registerName === "pc") register[registerName] = value & 0xffff;
  }

  function halt() {
    isHalted = true;
  }

  function unhalt() {
    isHalted = false;
  }

  function pause() {
    isPaused = true;
  }

  function unpause() {
    if (isPaused) {
      isPaused = false;
      frame();
    }
  }

  function enableInterrupts() {
    isInterruptMasterEnabled = true;
  }

  function scheduleInterruptEnable() {
    isPendingInterruptEnable = true;
  }

  function disableInterrupts() {
    isInterruptMasterEnabled = false;
    isPendingInterruptEnable = false;
    isJustWokeFromHalt = false;
  }

  function requestInterrupt(interruptType) {
    memory.writeByte(0xff0f, memory.readByte(0xff0f) | (1 << interruptType));
  }

  function resetDividerTimer() {
    const timer = mediator.getComponent("timer");
    if (timer) timer.resetDiv();
  }

  Object.assign(instance, {
    instance,
    register,
    clock,
    memory,
    INTERRUPTS,
    reset,
    loadRom,
    getRamSize,
    getGameName,
    run,
    stop,
    pause,
    unpause,
    setRegister,
    halt,
    unhalt,
    requestInterrupt,
    enableInterrupts,
    scheduleInterruptEnable,
    disableInterrupts,
    resetDividerTimer,
  });

  return instance;
}

export default createCPU;
