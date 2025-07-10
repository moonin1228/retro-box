import { useEffect, useState } from "react";
import { IoMdArrowRoundBack, IoMdSettings } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";

import GameBoyEmulator from "@/components/GameBoyEmulator.jsx";
import SettingsPanel from "@/components/SettingsPanel.jsx";

function GamePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const romData = location.state?.romData;
  const gameTitle = location.state?.gameTitle;

  useEffect(() => {
    if (!romData || !gameTitle) {
      console.warn("게임 데이터가 없습니다. 라이브러리 페이지로 이동합니다.");
      navigate("/library");
    }
  }, [romData, gameTitle, navigate]);

  const handleBackToLibrary = () => {
    navigate("/library");
  };

  if (!romData || !gameTitle) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg">게임을 불러오는 중...</p>
          <button
            onClick={handleBackToLibrary}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            type="button"
          >
            라이브러리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-0 bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat opacity-90" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8">
        <GameBoyEmulator romData={romData} />

        <button
          onClick={handleBackToLibrary}
          className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-gray-800/80 px-4 py-2 text-white transition-colors hover:bg-gray-700/80"
          type="button"
        >
          <IoMdArrowRoundBack size={20} />
          <span>라이브러리</span>
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-gray-800/80 px-4 py-2 text-white transition-colors hover:bg-gray-700/80"
          type="button"
        >
          <IoMdSettings size={20} />
          <span>설정</span>
        </button>

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}

export default GamePage;
