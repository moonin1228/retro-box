import { useEffect, useState } from "react";
import { IoMdArrowRoundBack, IoMdSettings } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";

import GameBoyEmulator from "@/components/GameBoyEmulator.jsx";
import BackConfirmModal from "@/components/modals/BackConfirmModal.jsx";

function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const romData = location.state?.romData;
  const gameTitle = location.state?.gameTitle;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (!romData || !gameTitle) {
      console.warn("게임 데이터가 없습니다. 라이브러리 페이지로 이동합니다.");
      navigate("/library");
    }
  }, [romData, gameTitle, navigate]);

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
    navigate("/library");
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    window.history.pushState(null, "", window.location.pathname);
  };

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
