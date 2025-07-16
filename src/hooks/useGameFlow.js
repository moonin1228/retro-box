import { useState } from "react";
import { useNavigate } from "react-router-dom";

function useGameFlow(loadRomFromCache) {
  const [saveModal, setSaveModal] = useState({ isOpen: false, game: null });
  const navigate = useNavigate();

  function openModalWithGame(game) {
    setSaveModal({ isOpen: true, game });
  }

  function closeModal() {
    setSaveModal({ isOpen: false, game: null });
  }

  async function navigateToGame(game, saveData) {
    if (!game) return;

    let romData = game.romData;
    if (!romData && game.fileName) {
      romData = await loadRomFromCache(game.fileName);
    }

    navigate("/game", {
      state: { romData, gameTitle: game.title, saveData },
    });
  }

  async function handleLoadSave(saveData) {
    await navigateToGame(saveModal.game, saveData);
  }

  async function handleStartNewGame() {
    await navigateToGame(saveModal.game, null);
  }

  return {
    saveModal,
    openModalWithGame,
    closeModal,
    handleLoadSave,
    handleStartNewGame,
  };
}

export default useGameFlow;
