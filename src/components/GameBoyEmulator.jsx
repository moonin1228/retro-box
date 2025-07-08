import { useEffect, useRef } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

import createGameBoy from "@/emulator/gameBoy.js";
import useGameInput from "@/hooks/useGameInput.jsx";
import useEmulatorSettings from "@/stores/useEmulatorSettings.js";
import useGameInputStore from "@/stores/useGameInputStore.js";
import useGameStatus from "@/stores/useGameStatus.js";

function GameBoyEmulator({ romData }) {
  const canvasRef = useRef(null);
  const gameBoyRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isGamePause, togglePause } = useGameStatus();
  const { volume } = useEmulatorSettings();
  const volumeUpdateRef = useRef(null);

  useGameInput();

  const updateVolume = () => {
    if (gameBoyRef.current) {
      const gbVolume = Math.floor((volume / 100) * 7);
      const nr50Value = (gbVolume << 4) | gbVolume;
      if (gameBoyRef.current.cpu?.memory) {
        gameBoyRef.current.cpu.memory.wb(0xff24, nr50Value);
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
      romReaders: romData ? [] : undefined,
    });
    gameBoyRef.current = gameBoy;

    return () => {
      if (gameBoyRef.current) {
        gameBoyRef.current.resetAudio();
        gameBoyRef.current.pause(true);
      }
      if (volumeUpdateRef.current) {
        clearInterval(volumeUpdateRef.current);
      }
    };
  }, [romData]);

  useEffect(() => {
    if (romData && gameBoyRef.current) {
      gameBoyRef.current.loadRomData(romData);
    }
  }, [romData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameBoyRef.current) {
        gameBoyRef.current.resetAudio();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="border-2 border-gray-800 bg-[#B3B3B3] focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="-mt-1 flex gap-5">
        <button
          onClick={handleTogglePause}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8]"
        >
          {isGamePause ? <FaPlay className="text-xl" /> : <FaPause className="text-xl" />}
        </button>
      </div>
    </div>
  );
}

export default GameBoyEmulator;
