import createApu from "@/emulator/audio/apu.js";
import createCPU from "@/emulator/cpu/cpu.js";
import GPU from "@/emulator/display/gpu.js";
import Screen from "@/emulator/display/screen.js";
import UnimplementedException from "@/emulator/exception.js";
import RomFileReader from "@/emulator/rom/file_reader.js";
import createRom from "@/emulator/rom/rom.js";
import { merge } from "@/emulator/util/util.js";

const defaultOptions = Object.freeze({
  zoom: 1,
  romReaders: [],
  statusContainerId: "status",
  gameNameContainerId: "game-name",
  errorContainerId: "error",
});

const createGameBoy = (canvas, options = {}) => {
  const opts = merge({}, defaultOptions, options);

  const api = {};
  const apu = createApu();
  const cpu = createCPU(api, { apu });
  const screen = Screen(canvas, opts.zoom);
  const gpu = GPU(screen, cpu);
  cpu.gpu = gpu;
  cpu.apu = apu;

  const statusContainer =
    document.getElementById(opts.statusContainerId) || document.createElement("div");
  const gameNameContainer =
    document.getElementById(opts.gameNameContainerId) || document.createElement("div");
  const errorContainer =
    document.getElementById(opts.errorContainerId) || document.createElement("div");

  const setStatus = (txt) => (statusContainer.textContent = txt);
  const setError = (txt) => {
    errorContainer.classList.remove("hide");
    errorContainer.textContent = txt;
  };
  const setGameName = (txt) => (gameNameContainer.textContent = txt);

  const error = (msg) => {
    setStatus("Error during execution");
    setError(`An error occurred during execution: ${msg}`);
    cpu.stop();
  };

  const resetAudio = () => {
    try {
      apu.disconnect();
      apu.reset();

      for (let addr = 0xff10; addr <= 0xff3f; addr++) {
        cpu.memory.writeByte(addr, 0);
      }

      cpu.memory.writeByte(0xff26, 0x00);
    } catch (error) {
      console.error("Error resetting audio:", error);
    }
  };

  const startRom = (romObj) => {
    errorContainer.classList.add("hide");
    resetAudio();
    cpu.reset();

    try {
      cpu.loadRom(romObj.getData());
      setStatus("Game Running :");
      setGameName(cpu.getGameName());
      cpu.run();
      screen.canvas.focus();
    } catch (e) {
      handleException(e);
    }
  };

  const loadRomData = (romData) => {
    errorContainer.classList.add("hide");
    resetAudio();
    cpu.reset();

    try {
      cpu.loadRom(romData);
      setStatus("Game Running :");
      setGameName(cpu.getGameName());
      cpu.run();
      screen.canvas.focus();
    } catch (e) {
      handleException(e);
    }
  };

  const rom = createRom({ startRom, error });

  const readers = opts.romReaders.length ? opts.romReaders : [];
  if (readers.length === 0) {
    const fileInput = document.getElementById("file");
    if (fileInput) {
      readers.push(RomFileReader());
    }
  }

  readers.forEach((r) => rom.addReader(r));

  const pause = (flag) => {
    if (flag) {
      setStatus("Game Paused :");
      cpu.pause();
      resetAudio();
    } else {
      setStatus("Game Running :");
      cpu.unpause();
      apu.connect();
    }
  };

  const setSoundEnabled = (v) => {
    if (v) {
      apu.connect();
    } else {
      resetAudio();
    }
  };

  const setScreenZoom = (v) => screen.setPixelSize(v);

  const handleException = (e) => {
    if (e instanceof UnimplementedException) {
      e.fatal ? error(`This cartridge is not supported (${e.message})`) : console.error(e.message);
    } else {
      throw e;
    }
  };

  Object.assign(api, {
    handleException,
  });

  return Object.freeze({
    cpu,
    screen,
    pause,
    setSoundEnabled,
    setScreenZoom,
    setStatus,
    setError,
    setGameName,
    handleException,
    loadRomData,
    resetAudio,
  });
};

export default createGameBoy;
