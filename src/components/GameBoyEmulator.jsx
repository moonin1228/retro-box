import { useEffect, useRef, useState } from "react";
import { FaDownload, FaPause, FaPlay } from "react-icons/fa";
import { IoIosSave, IoMdSettings } from "react-icons/io";
import { Tooltip } from "react-tooltip";

import SettingsPanel from "@/components/SettingsPanel.jsx";
import createGameBoy from "@/emulator/gameBoy.js";
import { loadCurrentState, saveCurrentState } from "@/emulator/util/saveUtils.js";
import useGameInput from "@/hooks/useGameInput.jsx";
import useEmulatorSettings from "@/stores/useEmulatorSettings.js";
import useGameInputStore from "@/stores/useGameInputStore.js";
import useGameStatus from "@/stores/useGameStatus.js";

function GameBoyEmulator({ romData, onEmulatorReady, gameTitle }) {
  const canvasRef = useRef(null);
  const gameBoyRef = useRef(null);
  const { isGamePause, togglePause } = useGameStatus();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { volume } = useEmulatorSettings();
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
      zoom: 6,
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
    if (gameBoyRef.current?.cpu) {
      gameBoyRef.current.cpu.input = {
        getInputMask: () => {
          const currentMask = useGameInputStore.getState().inputMask;
          return currentMask;
        },
      };
    }
  }, []);

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
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="border-2 border-gray-800 bg-[#B3B3B3] focus:ring-2 focus:outline-none"
        />
      </div>

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-gray-800/80 px-4 py-2 text-white transition-colors hover:bg-gray-700/80"
        type="button"
      >
        <IoMdSettings size={20} />
        <span>설정</span>
      </button>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameBoyRef={gameBoyRef}
        gameTitle={gameTitle}
      />

      <div className="-mt-1 flex gap-5">
        <button
          type="button"
          onClick={handleSaveData}
          data-tooltip-id="emulator-tooltip"
          data-tooltip-content="현재 상태 저장하기"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8]"
        >
          <IoIosSave className="text-3xl" />
        </button>

        <button
          onClick={handleTogglePause}
          type="button"
          data-tooltip-id="emulator-tooltip"
          data-tooltip-content={isGamePause ? "게임 재개하기" : "게임 일시정지"}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8]"
        >
          {isGamePause ? <FaPlay className="text-xl" /> : <FaPause className="text-xl" />}
        </button>
        <button
          type="button"
          onClick={handleLoadData}
          data-tooltip-id="emulator-tooltip"
          data-tooltip-content="저장된 상태 불러오기"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8]"
        >
          <FaDownload className="text-2xl" />
        </button>
        <Tooltip id="emulator-tooltip" place="top" />
      </div>
    </div>
  );
}

export default GameBoyEmulator;
