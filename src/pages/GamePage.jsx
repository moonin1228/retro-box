import { useState } from "react";

import GameBoyEmulator from "@/components/GameBoyEmulator.jsx";
import SettingsPanel from "@/components/SettingsPanel.jsx";

function GamePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-0 bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat opacity-90" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8">
        <GameBoyEmulator />

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 rounded-full bg-gray-800 p-2 text-white hover:bg-gray-700"
          title="설정 열기"
          type="button"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" />
        </button>
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}

export default GamePage;
