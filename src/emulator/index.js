import {
  createGameBoyCPU,
  dumpState,
  fetchByte,
  read8Reg,
  read16Reg,
  write8Reg,
  write16Reg,
} from "@/emulator/cpu/cpu.js";
import { executeOpcode } from "@/emulator/cpu/opcodes.js";

let gameBoyCore = null;

// 에뮬레이터 상태 관리
export const EmulatorState = {
  STOPPED: "stopped",
  RUNNING: "running",
  PAUSED: "paused",
  STEP: "step",
};

// 에뮬레이터 초기화
export function initializeEmulator() {
  gameBoyCore = {
    cpu: createGameBoyCPU(),
    state: EmulatorState.STOPPED,
    frameCount: 0,
    lastFrameTime: 0,
    targetFPS: 60,
    targetCyclesPerFrame: 70224, // ~4.19MHz / 60fps
  };

  console.log("[에뮬레이터] Game Boy 초기화 완료");
  return gameBoyCore;
}

// 한 사이클 실행
export function executeCycle(gameboy = gameBoyCore) {
  if (!gameboy || gameboy.cpu.halted) {
    return false;
  }

  try {
    // 명령어 fetch & execute
    const opcode = fetchByte(gameboy.cpu);
    executeOpcode(gameboy.cpu, opcode);
    return true;
  } catch (error) {
    console.error("[CPU 에러]", error.message);
    gameboy.state = EmulatorState.STOPPED;
    return false;
  }
}

// 한 프레임 실행 (목표 사이클까지)
export function executeFrame(gameboy = gameBoyCore) {
  if (!gameboy || gameboy.state !== EmulatorState.RUNNING) {
    return;
  }

  const startCycles = gameboy.cpu.cycles;
  const targetCycles = startCycles + gameboy.targetCyclesPerFrame;

  while (gameboy.cpu.cycles < targetCycles && gameboy.state === EmulatorState.RUNNING) {
    if (!executeCycle(gameboy)) {
      break;
    }
  }

  gameboy.frameCount++;
}

// 메인 루프 (requestAnimationFrame 기반)
export function startMainLoop(gameboy = gameBoyCore) {
  if (!gameboy) {
    console.error("[에뮬레이터] 초기화되지 않음");
    return;
  }

  gameboy.state = EmulatorState.RUNNING;

  function loop(timestamp) {
    if (gameboy.state === EmulatorState.RUNNING) {
      // FPS 제한
      if (timestamp - gameboy.lastFrameTime >= 1000 / gameboy.targetFPS) {
        executeFrame(gameboy);
        gameboy.lastFrameTime = timestamp;
      }

      requestAnimationFrame(loop);
    }
  }

  console.log("[에뮬레이터] 메인 루프 시작");
  requestAnimationFrame(loop);
}

// 에뮬레이터 정지
export function stopEmulator(gameboy = gameBoyCore) {
  if (gameboy) {
    gameboy.state = EmulatorState.STOPPED;
    console.log("[에뮬레이터] 정지됨");
  }
}

// 에뮬레이터 일시정지/재개
export function pauseEmulator(gameboy = gameBoyCore) {
  if (gameboy) {
    if (gameboy.state === EmulatorState.RUNNING) {
      gameboy.state = EmulatorState.PAUSED;
      console.log("[에뮬레이터] 일시정지");
    } else if (gameboy.state === EmulatorState.PAUSED) {
      startMainLoop(gameboy);
      console.log("[에뮬레이터] 재개");
    }
  }
}

// 단일 스텝 실행 (디버깅용)
export function stepEmulator(gameboy = gameBoyCore) {
  if (gameboy) {
    gameboy.state = EmulatorState.STEP;
    const success = executeCycle(gameboy);
    gameboy.state = EmulatorState.PAUSED;

    console.log("[스텝 실행]", {
      PC: `0x${read16Reg(gameboy.cpu, "PC").toString(16).padStart(4, "0")}`,
      cycles: gameboy.cpu.cycles,
      success,
    });

    return success;
  }
  return false;
}

// ROM 로딩 (임시 구현)
export function loadROM(romData, gameboy = gameBoyCore) {
  if (!gameboy) {
    console.error("[ROM 로더] 에뮬레이터가 초기화되지 않음");
    return false;
  }

  console.log(`[ROM 로더] ROM 로딩: ${romData.length}바이트`);
  // TODO: 실제 MMU에 ROM 데이터 로딩
  return true;
}

// 디버깅 함수들
export const Debug = {
  // CPU 상태 출력
  dumpCPU(gameboy = gameBoyCore) {
    if (!gameboy) return null;
    return dumpState(gameboy.cpu);
  },

  // 레지스터 값 읽기
  readRegister(reg, gameboy = gameBoyCore) {
    if (!gameboy) return null;

    if (reg.length === 1) {
      return read8Reg(gameboy.cpu, reg);
    }
    return read16Reg(gameboy.cpu, reg);
  },

  // 레지스터 값 쓰기
  writeRegister(reg, value, gameboy = gameBoyCore) {
    if (!gameboy) return false;

    try {
      if (reg.length === 1) {
        write8Reg(gameboy.cpu, reg, value);
      } else {
        write16Reg(gameboy.cpu, reg, value);
      }
      return true;
    } catch (error) {
      console.error("[디버그 에러]", error.message);
      return false;
    }
  },

  // 프레임 통계
  getStats(gameboy = gameBoyCore) {
    if (!gameboy) return null;

    return {
      state: gameboy.state,
      frameCount: gameboy.frameCount,
      totalCycles: gameboy.cpu.cycles,
      fps: gameboy.targetFPS,
    };
  },
};

// 브라우저 전역 객체에 등록
if (typeof window !== "undefined") {
  window.gb = {
    init: initializeEmulator,
    start: startMainLoop,
    stop: stopEmulator,
    pause: pauseEmulator,
    step: stepEmulator,
    loadROM,
    debug: Debug,

    // 빠른 접근용
    get cpu() {
      return gameBoyCore?.cpu;
    },
    get state() {
      return gameBoyCore?.state;
    },
  };

  console.log("🎮 Game Boy 에뮬레이터가 window.gb에 등록되었습니다!");
  console.log("사용법:");
  console.log("  window.gb.init()     - 에뮬레이터 초기화");
  console.log("  window.gb.start()    - 실행 시작");
  console.log("  window.gb.pause()    - 일시정지/재개");
  console.log("  window.gb.step()     - 단일 스텝 실행");
  console.log("  window.gb.debug.dumpCPU() - CPU 상태 출력");
}
