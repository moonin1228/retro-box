import { useEffect, useRef } from "react";

import createGameBoy from "@/emulator/gameBoy.js";
import useGameInput from "@/hooks/useGameInput.jsx";
import useGameInputStore from "@/stores/useGameInputStore.js";

function GameBoyEmulator() {
  const canvasRef = useRef(null);
  const gameBoyRef = useRef(null);
  const fileInputRef = useRef(null);

  useGameInput();

  useEffect(() => {
    if (canvasRef.current) {
      gameBoyRef.current = createGameBoy(canvasRef.current, {
        zoom: 1,
      });
    }
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

  const handlePause = () => {
    if (gameBoyRef.current) {
      gameBoyRef.current.pause(true);
    }
  };

  const handleResume = () => {
    if (gameBoyRef.current) {
      gameBoyRef.current.pause(false);
    }
  };

  return (
    <div className="p-5 text-center">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">🎮 게임보이 에뮬레이터</h1>

      <div className="mb-5">
        <input
          id="file"
          ref={fileInputRef}
          type="file"
          accept=".gb,.gbc"
          onChange={handleFileUpload}
          className="mb-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:border-transparent focus:ring-2 focus:outline-none"
        />
        <div className="space-x-2">
          <button
            onClick={handlePause}
            type="button"
            className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
          >
            일시정지
          </button>
          <button
            onClick={handleResume}
            type="button"
            className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
          >
            재시작
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="border-2 border-gray-800 bg-[#B3B3B3] focus:ring-2 focus:outline-none"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div id="status" className="mt-3 font-bold text-gray-700">
        ROM 파일을 업로드하세요
      </div>
      <div id="game-name" className="mt-1 text-sm text-gray-600" />
      <div id="error" className="hide mt-3 text-red-600" />
    </div>
  );
}

export default GameBoyEmulator;
