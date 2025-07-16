import { useEffect, useRef } from "react";

import EmulatorControls from "@/components/emulator/EmulatorControls.jsx";
import VirtualGamepad from "@/components/emulator/VirtualGamepad.jsx";
import { loadCurrentState, saveCurrentState } from "@/emulator/util/saveUtils.js";
import useAutoSave from "@/hooks/useAutoSave.js";
import useGameBoyInitializer from "@/hooks/useGameBoyInitializer.js";
import useGameBoyInputBinding from "@/hooks/useGameBoyInputBinding.js";
import useGameInput from "@/hooks/useGameInput.js";
import useRomDataLoader from "@/hooks/useRomDataLoader.js";
import useVisibilityPause from "@/hooks/useVisibilityPause.js";
import useVolumeUpdater from "@/hooks/useVolumeUpdater.js";
import useEmulatorSettings from "@/stores/useEmulatorSettings.js";
import useGameStatus from "@/stores/useGameStatus.js";
import useSettingsStore from "@/stores/useSettingsStore.js";

function GameBoyEmulator({ romData, onLoadSaveCallback }) {
  const canvasRef = useRef(null);
  const gameBoyRef = useRef(null);
  const { isGamePause, togglePause } = useGameStatus();

  const { volume } = useEmulatorSettings();
  const { autoSave } = useSettingsStore();
  const volumeUpdateRef = useRef(null);

  useGameInput();
  useVolumeUpdater(volume, gameBoyRef);
  useGameBoyInitializer(canvasRef, gameBoyRef, volumeUpdateRef, romData, onLoadSaveCallback);
  useRomDataLoader(romData, gameBoyRef);
  useVisibilityPause(gameBoyRef, isGamePause);
  useGameBoyInputBinding(gameBoyRef);
  useAutoSave(gameBoyRef, autoSave);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  function handleTogglePause() {
    if (!gameBoyRef.current) return;
    togglePause();
    gameBoyRef.current.pause(isGamePause);
  }

  function handleSaveData() {
    saveCurrentState(gameBoyRef.current.cpu);
  }

  function handleLoadData() {
    loadCurrentState(gameBoyRef.current.cpu);
  }

  return (
    <div className="noselect touch-callout-none flex flex-col items-center gap-5 select-none md:gap-6 lg:gap-8">
      <section className="-mt-15 flex justify-center md:-mt-0">
        <canvas
          ref={canvasRef}
          width={160}
          height={144}
          className="-mt-50 aspect-[160/144] w-[95vw] max-w-[100vw] border-2 border-gray-800 bg-[#B3B3B3] focus:ring-2 focus:outline-none sm:max-w-[320px] md:-mt-10 md:max-w-[768px] lg:-mt-10 lg:w-[48vw] lg:max-w-full"
        />
      </section>

      <section className="relative flex w-full justify-center md:hidden">
        <EmulatorControls
          isGamePause={isGamePause}
          onSave={handleSaveData}
          onPauseToggle={handleTogglePause}
          onLoad={handleLoadData}
          size="sm"
        />
        <VirtualGamepad />
      </section>

      <section className="-mt-6 hidden gap-5 md:flex md:gap-6 lg:gap-8">
        <EmulatorControls
          isGamePause={isGamePause}
          onSave={handleSaveData}
          onPauseToggle={handleTogglePause}
          onLoad={handleLoadData}
          size="md"
        />
      </section>
    </div>
  );
}

export default GameBoyEmulator;
