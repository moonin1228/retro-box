import createApu from "@/emulator/audio/apu.ts";
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

interface AutoSaveSettings {
  enabled: boolean;
  interval: number;
}

interface GameBoyOptions {
  zoom?: number;
  romReaders?: any[];
  statusContainerId?: string;
  gameNameContainerId?: string;
  errorContainerId?: string;
}

interface EventSubscriptions {
  resetAutoSaveTimer: () => void;
}

interface Mediator {
  registerComponent(name: string, component: any): void;
  getComponent(name: string): any;
  subscribe(event: string, callback: (eventData: any) => void): void;
  EVENTS: {
    cpu: {
      frameComplete: string;
    };
  };
}

type CPU = any;

interface APU {
  disconnect(): void;
  reset(): void;
  clearBuffer(): void;
  connect(): void;
}

interface Screen {
  canvas: HTMLCanvasElement;
  setPixelSize(zoomLevel: number): void;
}

interface Rom {
  addReader(reader: any): void;
}

interface RomObject {
  getData(): Uint8Array | null;
}

export interface GameBoyInstance {
  cpu: CPU;
  screen: Screen;
  pause(flag: boolean): void;
  setSoundEnabled(isSoundOn: boolean): void;
  setScreenZoom(zoomLevel: number): void;
  handleException(error: unknown): void;
  loadRomData(romData: Uint8Array): void;
  resetAudio(): void;
  updateAutoSaveSettings(newSettings: Partial<AutoSaveSettings>): void;
  setGamePaused(paused: boolean): void;
  getAutoSaveSettings(): AutoSaveSettings;
}

const setupEventSubscriptions = (
  mediator: Mediator,
  getAutoSaveSettings: () => AutoSaveSettings,
): EventSubscriptions => {
  let totalCycles = 0;
  let lastSaveTime = performance.now();

  mediator.subscribe(mediator.EVENTS.cpu.frameComplete, (eventData: any) => {
    totalCycles += eventData.data.frameCount;

    const autoSaveSettings = getAutoSaveSettings();

    if (!autoSaveSettings.enabled) {
      return;
    }

    const now = performance.now();
    const elapsed = now - lastSaveTime;

    if (elapsed >= autoSaveSettings.interval) {
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

  return {
    resetAutoSaveTimer: () => {
      lastSaveTime = performance.now();
    },
  };
};

const defaultOptions: Required<GameBoyOptions> = {
  zoom: 1,
  romReaders: [],
  statusContainerId: "status",
  gameNameContainerId: "game-name",
  errorContainerId: "error",
};

function createGameBoy(canvas: HTMLCanvasElement, options: GameBoyOptions = {}): GameBoyInstance {
  const opts = merge({}, defaultOptions, options) as Required<GameBoyOptions>;

  const mediator = createEmulatorMediator() as Mediator;

  let autoSaveSettings: AutoSaveSettings = {
    enabled: false,
    interval: 1000,
  };

  let isGamePaused = false;

  const getAutoSaveSettings = (): AutoSaveSettings => {
    const result = {
      enabled: autoSaveSettings.enabled && !isGamePaused,
      interval: autoSaveSettings.interval,
    };

    return result;
  };

  const memory = createMemory(mediator);
  mediator.registerComponent("memory", memory);

  const apu = createApu() as APU;

  const timer = createTimer(mediator);
  mediator.registerComponent("timer", timer);

  const cpu = createCPU(mediator) as CPU;
  mediator.registerComponent("cpu", cpu);

  const screen = createScreen(canvas, opts.zoom) as Screen;
  mediator.registerComponent("screen", screen);

  const gpu = createGPU(mediator);
  mediator.registerComponent("gpu", gpu);

  const eventSubscriptions = setupEventSubscriptions(mediator, getAutoSaveSettings);

  cpu.apu = apu;

  function resetAudio(): void {
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

  function startRom(romObject: RomObject): void {
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

  function loadRomData(romData: Uint8Array): void {
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

  const gameBoyInterface = {
    error: (msg: string) => console.error("[ROM Error]", msg),
    startRom: (rom: any) => startRom(rom),
  };

  const rom = createRom(gameBoyInterface, null as any) as Rom;

  const readers: any[] = opts.romReaders.length ? opts.romReaders : [];
  if (readers.length === 0) {
    const fileInput = document.getElementById("file") as HTMLInputElement | null;
    if (fileInput) {
      readers.push(RomFileReader());
    }
  }

  readers.forEach((r) => rom.addReader(r));

  function pause(flag: boolean): void {
    isGamePaused = flag;

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

  function setSoundEnabled(isSoundOn: boolean): void {
    if (isSoundOn) {
      apu.connect();
    } else {
      resetAudio();
    }
  }

  function setScreenZoom(zoomLevel: number): void {
    screen.setPixelSize(zoomLevel);
  }

  function handleException(error: unknown): void {
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

    updateAutoSaveSettings: (newSettings: Partial<AutoSaveSettings>): void => {
      autoSaveSettings = { ...autoSaveSettings, ...newSettings };
      if (eventSubscriptions?.resetAutoSaveTimer) {
        eventSubscriptions.resetAutoSaveTimer();
      }
    },

    setGamePaused: (paused: boolean): void => {
      isGamePaused = paused;
    },

    getAutoSaveSettings: (): AutoSaveSettings => autoSaveSettings,
  });
}

export default createGameBoy;
