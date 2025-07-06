import { useEffect, useRef } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

import createGameBoy from "@/emulator/gameBoy.js";
import useGameInput from "@/hooks/useGameInput.jsx";
import useGameInputStore from "@/stores/useGameInputStore.js";
import useGameStatus from "@/stores/useGameStatus.js";

function GameBoyEmulator() {
  const canvasRef = useRef(null);
  const gameBoyRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isGamePause, togglePause } = useGameStatus();

  useGameInput();

  useEffect(() => {
    if (!canvasRef.current) return;

    const gameBoy = createGameBoy(canvasRef.current, {
      zoom: 5,
    });
    gameBoyRef.current = gameBoy;

    return () => {
      if (gameBoyRef.current) {
        gameBoyRef.current.resetAudio();
        gameBoyRef.current.pause(true);
      }
    };
  }, []);

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const romData = new Uint8Array(e.target.result);

        if (gameBoyRef.current) {
          gameBoyRef.current.loadRomData(romData);
        }
      } catch (error) {
        console.error("ROM 로드 에러:", error);
        if (gameBoyRef.current) {
          gameBoyRef.current.setError(`ROM 파일을 로드할 수 없습니다: ${error.message}`);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTogglePause = () => {
    if (gameBoyRef.current) {
      gameBoyRef.current.pause(!isGamePause);
      togglePause();
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <input
        id="file"
        ref={fileInputRef}
        type="file"
        accept=".gb,.gbc"
        onChange={handleFileUpload}
        className="mb-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:border-transparent focus:ring-2 focus:outline-none"
      />

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="border-2 border-gray-800 bg-[#B3B3B3] focus:ring-2 focus:outline-none"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div id="game-name" className="mt-1 text-sm text-gray-600" />
      <div id="error" className="hide mt-1 text-red-600" />

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
