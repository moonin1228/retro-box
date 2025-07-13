import createApu from "@/emulator/audio/apu.js";
import createCPU from "@/emulator/cpu/cpu.js";
import createTimer from "@/emulator/cpu/timer.js";
import createGPU from "@/emulator/display/gpu.js";
import createScreen from "@/emulator/display/screen.js";
import UnimplementedException from "@/emulator/exception.js";
import createEmulatorMediator from "@/emulator/mediator/emulatorMediator.js";
import createMemory from "@/emulator/memory/memory.js";
import RomFileReader from "@/emulator/rom/file_reader.js";
import createRom from "@/emulator/rom/rom.js";
import { saveCurrentState } from "@/emulator/util/saveUtils.js";
import { merge } from "@/emulator/util/util.js";

const setupEventSubscriptions = (mediator) => {
  let totalCycles = 0;

  const AUTO_SAVE_INTERVAL = 2000;
  let lastSaveTime = performance.now();

  mediator.subscribe(mediator.EVENTS.cpu.frameComplete, (eventData) => {
    totalCycles += eventData.data.frameCount;

    const now = performance.now();
    const elapsed = now - lastSaveTime;

    if (elapsed >= AUTO_SAVE_INTERVAL) {
      try {
        const cpu = mediator.getComponent("cpu");
        if (cpu) {
          saveCurrentState(cpu);
        }
      } catch (error) {
        console.warn("[AutoSave] 자동 저장 실패:", error);
      }
      lastSaveTime = now;
    }
  });
};

const defaultOptions = {
  zoom: 1,
  romReaders: [],
  statusContainerId: "status",
  gameNameContainerId: "game-name",
  errorContainerId: "error",
};

function createGameBoy(canvas, options = {}) {
  const opts = merge({}, defaultOptions, options);

  const mediator = createEmulatorMediator();

  const memory = createMemory(mediator);
  mediator.registerComponent("memory", memory);

  const apu = createApu();

  const timer = createTimer(mediator);
  mediator.registerComponent("timer", timer);

  const cpu = createCPU(mediator);
  mediator.registerComponent("cpu", cpu);

  const screen = createScreen(canvas, opts.zoom);
  mediator.registerComponent("screen", screen);

  const gpu = createGPU(mediator);
  mediator.registerComponent("gpu", gpu);

  setupEventSubscriptions(mediator);

  cpu.apu = apu;

  function resetAudio() {
    try {
      apu.disconnect();
      apu.reset();

      for (let address = 0xff10; address <= 0xff3f; address++) {
        cpu.memory.writeByte(address, 0);
      }

      cpu.memory.writeByte(0xff26, 0x00);
    } catch (error) {
      console.error("[gameBoy] 에러 재설정 오류", error);
    }
  }

  function startRom(romObject) {
    resetAudio();
    cpu.reset();

    try {
      cpu.loadRom(romObject.getData());
      cpu.run();
      screen.canvas.focus();
    } catch (e) {
      handleException(e);
    }
  }

  function loadRomData(romData) {
    resetAudio();
    cpu.reset();

    try {
      cpu.loadRom(romData);
      cpu.run();
      screen.canvas.focus();
    } catch (e) {
      handleException(e);
    }
  }

  const rom = createRom({ startRom });

  const readers = opts.romReaders.length ? opts.romReaders : [];
  if (readers.length === 0) {
    const fileInput = document.getElementById("file");
    if (fileInput) {
      readers.push(RomFileReader());
    }
  }

  readers.forEach((r) => rom.addReader(r));

  function pause(flag) {
    if (flag) {
      cpu.pause();
      if (apu) {
        apu.clearBuffer();
        apu.disconnect();
      }
    } else {
      cpu.unpause();
      apu.connect();
    }
  }

  function setSoundEnabled(isSoundOn) {
    if (isSoundOn) {
      apu.connect();
    } else {
      resetAudio();
    }
  }

  function setScreenZoom(zoomLevel) {
    screen.setPixelSize(zoomLevel);
  }

  function handleException(error) {
    if (error instanceof UnimplementedException) {
      console.error(error);
    } else {
      throw error;
    }
  }

  return Object.freeze({
    cpu,
    screen,
    pause,
    setSoundEnabled,
    setScreenZoom,
    handleException,
    loadRomData,
    resetAudio,
  });
}

export default createGameBoy;
