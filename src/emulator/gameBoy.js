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
  const cpu = createCPU(api, {});
  const screen = Screen(canvas, opts.zoom);
  const gpu = GPU(screen, cpu);
  cpu.gpu = gpu;

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

  const startRom = (romObj) => {
    errorContainer.classList.add("hide");
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
  (opts.romReaders.length ? opts.romReaders : [RomFileReader()]).forEach((r) => rom.addReader(r));

  const pause = (flag) => {
    if (flag) {
      setStatus("Game Paused :");
      cpu.pause();
    } else {
      setStatus("Game Running :");
      cpu.unpause();
    }
  };

  const setSoundEnabled = (v) => (v ? cpu.apu.connect() : cpu.apu.disconnect());
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
  });
};

export default createGameBoy;
