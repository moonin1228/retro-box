import { useEffect } from "react";

import createGameBoy from "@/emulator/gameBoy.js";

function useGameBoyInitializer(
  canvasRef,
  gameBoyRef,
  volumeUpdateRef,
  romData,
  onLoadSaveCallback,
) {
  useEffect(() => {
    if (!canvasRef.current) return;

    const gameBoy = createGameBoy(canvasRef.current, {
      zoom: 5,
    });
    gameBoyRef.current = gameBoy;

    if (onLoadSaveCallback) {
      onLoadSaveCallback(() => (saveData) => {
        if (gameBoyRef.current?.cpu && saveData) {
          const cpu = gameBoyRef.current.cpu;
          Object.assign(cpu.register, saveData.cpu.register);
          cpu.clock.cycles = saveData.cpu.clock.cycles;
          cpu.isInterruptMasterEnabled = saveData.cpu.ime;
          cpu.isHalted = saveData.cpu.halted;
          cpu.isPaused = saveData.cpu.paused;
          cpu.memory.loadSnapshot(saveData.memory);
        }
      });
    }

    return () => {
      if (gameBoyRef.current) {
        gameBoyRef.current.resetAudio();
        gameBoyRef.current.pause(true);
      }
      if (volumeUpdateRef.current) {
        clearInterval(volumeUpdateRef.current);
      }
    };
  }, [romData, onLoadSaveCallback]);
}

export default useGameBoyInitializer;
