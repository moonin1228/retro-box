import { useEffect, useState } from "react";
import { IoMdArrowRoundBack, IoMdSettings } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";

import GameBoyEmulator from "@/components/emulator/GameBoyEmulator.jsx";
import BackConfirmModal from "@/components/modals/BackConfirmModal.jsx";
import SettingsPanel from "@/components/setting/SettingsPanel.jsx";

function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadSaveFunction, setLoadSaveFunction] = useState(() => null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const romData = location.state?.romData;
  const gameTitle = location.state?.gameTitle;
  const saveData = location.state?.saveData;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (!romData || !gameTitle) {
      console.warn("게임 데이터가 없습니다. 라이브러리 페이지로 이동합니다.");
      navigate("/library", { state: { shouldRefresh: true } });
    }
  }, [romData, gameTitle, navigate]);

  useEffect(() => {
    if (saveData && loadSaveFunction) {
      setTimeout(() => loadSaveFunction(saveData), 200);
    }
  }, [saveData, loadSaveFunction]);

  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      setShowConfirmModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleBackToLibrary = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmNavigation = () => {
    setShowConfirmModal(false);
    navigate("/library", { state: { shouldRefresh: true } });
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    window.history.pushState(null, "", window.location.pathname);
  };

  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-0 bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat opacity-90" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8">
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
        <GameBoyEmulator romData={romData} onLoadSaveCallback={setLoadSaveFunction} />

        <button
          onClick={handleBackToLibrary}
          className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-gray-800/80 px-4 py-2 text-white transition-colors hover:bg-gray-700/80"
          type="button"
        >
          <IoMdArrowRoundBack size={20} />
        </button>

        <BackConfirmModal
          isOpen={showConfirmModal}
          onConfirm={handleConfirmNavigation}
          onCancel={handleCancelNavigation}
        />
      </div>
    </div>
  );
}

export default GamePage;
