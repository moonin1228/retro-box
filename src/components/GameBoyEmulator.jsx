import { useEffect, useRef, useState } from "react";
import { FaDownload, FaPause, FaPlay } from "react-icons/fa";
import { IoIosSave, IoMdSettings } from "react-icons/io";
import { Tooltip } from "react-tooltip";

import SettingsPanel from "@/components/SettingsPanel.jsx";
import VirtualGamepad from "@/components/VirtualGamepad.jsx";
import createGameBoy from "@/emulator/gameBoy.js";
import { loadCurrentState, saveCurrentState } from "@/emulator/util/saveUtils.js";
import useGameInput from "@/hooks/useGameInput.jsx";
import useEmulatorSettings from "@/stores/useEmulatorSettings.js";
import useGameInputStore from "@/stores/useGameInputStore.js";
import useGameStatus from "@/stores/useGameStatus.js";
import useSettingsStore from "@/stores/useSettingsStore.js";

function GameBoyEmulator({ romData, onEmulatorReady, gameTitle }) {
  const canvasRef = useRef(null);
  const gameBoyRef = useRef(null);
  const { isGamePause, togglePause } = useGameStatus();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { volume } = useEmulatorSettings();
  const { autoSave } = useSettingsStore();
  const volumeUpdateRef = useRef(null);

  useGameInput();

  const updateVolume = () => {
    if (gameBoyRef.current) {
      const gbVolume = Math.floor((volume / 100) * 7);
      const nr50Value = (gbVolume << 4) | gbVolume;
      if (gameBoyRef.current.cpu?.memory) {
        gameBoyRef.current.cpu.memory.writeByte(0xff24, nr50Value);
      }
    }
  };

  useEffect(() => {
    if (volumeUpdateRef.current) {
      clearInterval(volumeUpdateRef.current);
    }

    updateVolume();

    volumeUpdateRef.current = setInterval(updateVolume, 1000 / 60);

    return () => {
      if (volumeUpdateRef.current) {
        clearInterval(volumeUpdateRef.current);
      }
    };
  }, [volume]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gameBoy = createGameBoy(canvasRef.current, {
      zoom: 5,
    });
    gameBoyRef.current = gameBoy;

    if (onEmulatorReady) {
      onEmulatorReady(gameBoy);
    }

    return () => {
      if (gameBoyRef.current) {
        gameBoyRef.current.pause(true);
      }
      if (volumeUpdateRef.current) {
        clearInterval(volumeUpdateRef.current);
      }
    };
  }, [romData, onEmulatorReady]);

  useEffect(() => {
    if (romData && gameBoyRef.current) {
      gameBoyRef.current.loadRomData(romData);
    }
  }, [romData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!gameBoyRef.current) return;

      if (document.hidden) {
        gameBoyRef.current.pause(true);
      } else if (!isGamePause) {
        gameBoyRef.current.pause(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isGamePause]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (gameBoyRef.current?.cpu) {
      gameBoyRef.current.cpu.input = {
        getInputMask: () => {
          const currentMask = useGameInputStore.getState().inputMask;
          return currentMask;
        },
      };
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.updateAutoSaveSettings?.(autoSave);
    }
  }, [autoSave]);

  useEffect(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.setGamePaused?.(isGamePause);
    }
  }, [isGamePause]);

  const handleTogglePause = () => {
    if (!gameBoyRef.current) return;
    togglePause();
    gameBoyRef.current.pause(isGamePause);
  };

  const handleSaveData = () => {
    saveCurrentState(gameBoyRef.current.cpu);
  };

  const handleLoadData = () => {
    loadCurrentState(gameBoyRef.current.cpu);
  };

  return (
    <div className="flex flex-col items-center gap-5 md:gap-6 lg:gap-8">
      <section className="-mt-15 flex justify-center md:-mt-0">
        <canvas
          ref={canvasRef}
          width={160}
          height={144}
          className="-mt-50 aspect-[160/144] w-[95vw] max-w-[100vw] border-2 border-gray-800 bg-[#B3B3B3] focus:ring-2 focus:outline-none sm:max-w-[320px] md:-mt-10 md:max-w-[768px] lg:-mt-10 lg:w-[48vw] lg:max-w-full"
          style={{ imageRendering: "pixelated" }}
        />
      </section>

      <section className="relative flex w-full justify-center md:hidden">
        <div className="-mt-3 flex gap-4">
          <button
            type="button"
            onClick={handleSaveData}
            data-tooltip-id="emulator-tooltip"
            data-tooltip-content="현재 상태 저장하기"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:h-11 md:w-11 lg:h-12 lg:w-12"
          >
            <IoIosSave className="text-3xl md:text-[34px] lg:text-[36px]" />
          </button>

          <button
            onClick={handleTogglePause}
            type="button"
            data-tooltip-id="emulator-tooltip"
            data-tooltip-content={isGamePause ? "게임 재개하기" : "게임 일시정지"}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:h-11 md:w-11 lg:h-12 lg:w-12"
          >
            {isGamePause ? (
              <FaPlay className="text-xl md:text-2xl lg:text-[26px]" />
            ) : (
              <FaPause className="text-xl md:text-2xl lg:text-[26px]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLoadData}
            data-tooltip-id="emulator-tooltip"
            data-tooltip-content="저장된 상태 불러오기"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:h-11 md:w-11 lg:h-12 lg:w-12"
          >
            <FaDownload className="text-xl md:text-[26px] lg:text-[28px]" />
          </button>
        </div>
        <VirtualGamepad />
      </section>

      <section>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-gray-900/80 px-2.5 py-2 text-white transition-colors hover:bg-gray-700/80 md:top-6 md:right-6 md:px-5 md:py-2.5 lg:px-3 lg:py-3"
          type="button"
        >
          <IoMdSettings size={20} />
          <span className="hidden text-sm md:inline md:text-base lg:text-lg">설정</span>
        </button>
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </section>

      <section className="-mt-6 hidden gap-5 md:flex md:gap-6 lg:gap-8">
        <button
          type="button"
          onClick={handleSaveData}
          data-tooltip-id="emulator-tooltip"
          data-tooltip-content="현재 상태 저장하기"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:h-11 md:w-11 lg:h-12 lg:w-12"
        >
          <IoIosSave className="text-3xl md:text-[34px] lg:text-[36px]" />
        </button>

        <button
          onClick={handleTogglePause}
          type="button"
          data-tooltip-id="emulator-tooltip"
          data-tooltip-content={isGamePause ? "게임 재개하기" : "게임 일시정지"}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:h-11 md:w-11 lg:h-12 lg:w-12"
        >
          {isGamePause ? (
            <FaPlay className="text-xl md:text-2xl lg:text-[26px]" />
          ) : (
            <FaPause className="text-xl md:text-2xl lg:text-[26px]" />
          )}
        </button>

        <button
          type="button"
          onClick={handleLoadData}
          data-tooltip-id="emulator-tooltip"
          data-tooltip-content="저장된 상태 불러오기"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:h-11 md:w-11 lg:h-12 lg:w-12"
        >
          <FaDownload className="text-2xl md:text-[26px] lg:text-[28px]" />
        </button>

        <Tooltip id="emulator-tooltip" place="top" />
      </section>
    </div>
  );
}

export default GameBoyEmulator;
