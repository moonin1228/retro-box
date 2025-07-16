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
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 flex items-center justify-center gap-2 rounded-md bg-[#dcd3cc] px-3 py-2 text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8] md:top-6 md:right-6 md:px-4 md:py-2.5 lg:px-4 lg:py-3"
          type="button"
        >
          <IoMdSettings size={18} />
          <span className="hidden text-sm md:inline md:text-base lg:text-lg">설정</span>
        </button>
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        <GameBoyEmulator romData={romData} onLoadSaveCallback={setLoadSaveFunction} />

        <button
          onClick={handleBackToLibrary}
          className="absolute top-4 left-4 flex items-center justify-center gap-2 rounded-md bg-[#dcd3cc] px-4 py-2 text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8]"
          type="button"
        >
          <IoMdArrowRoundBack size={20} />
          <span className="hidden text-sm md:inline md:text-base lg:text-lg">뒤로</span>
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
