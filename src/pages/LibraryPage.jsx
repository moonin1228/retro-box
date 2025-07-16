import { useEffect, useState } from "react";

import { createGameCartFromFile } from "@/components/cartridge/GameCart.jsx";
import GameLibraryEmpty from "@/components/library/GameLibraryEmpty.jsx";
import GameList from "@/components/library/GameList.jsx";
import LibraryHeader from "@/components/library/LibraryHeader.jsx";
import SaveLoadModal from "@/components/modals/SaveLoadModal.jsx";
import PageLoader from "@/components/util/PageLoader.jsx";
import Toast from "@/components/util/Toast.jsx";
import useFilteredGames from "@/hooks/useFilteredGames.js";
import useGameFlow from "@/hooks/useGameFlow.js";
import useGameLibrary from "@/hooks/useGameLibrary.js";
import useRomCacheStore from "@/stores/useRomCacheStore.js";

function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

  const { getRomCacheInfo, loadRomFromCache, deleteRomFromCache } = useRomCacheStore();
  const { games, isLoading, setGames } = useGameLibrary({
    getRomCacheInfo,
    loadRomFromCache,
  });
  const { saveModal, openModalWithGame, closeModal, handleLoadSave, handleStartNewGame } =
    useGameFlow(loadRomFromCache);

  const filteredGames = useFilteredGames(games, searchTerm);

  useEffect(() => {
    if (!sessionStorage.getItem("새로고침")) {
      sessionStorage.setItem("새로고침", "true");
      window.location.reload();
    } else {
      sessionStorage.removeItem("새로고침");
    }
  }, []);

  async function handleFileUpload(file) {
    if (!file) return;

    const gameData = await createGameCartFromFile(file);
    const newGame = {
      id: `user_${gameData.fileName}_${Date.now()}`,
      title: gameData.title,
      fileName: gameData.fileName,
      romData: gameData.romData,
      isUserGame: true,
      timestamp: Date.now(),
      size: gameData.romData.length,
    };

    setGames((prevGames) => [...prevGames, newGame]);
    setToast({
      isVisible: true,
      message: `${gameData.title} 게임이 추가되었습니다!`,
      type: "success",
    });
  }

  async function handlePlayGame(game) {
    openModalWithGame(game);
  }

  function handleCloseSaveModal() {
    closeModal({ isOpen: false, game: null });
  }

  async function handleDeleteGame(gameDelete) {
    if (!gameDelete.isUserGame) return;

    await deleteRomFromCache(gameDelete.fileName);
    setGames((prevGames) => prevGames.filter((game) => game.id !== gameDelete.id));
    setToast({
      isVisible: true,
      message: `${gameDelete.title} 게임이 삭제되었습니다.`,
      type: "success",
    });
  }

  return (
    <section className="relative min-h-screen w-full bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat select-none">
      {isLoading && <PageLoader />}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
      <SaveLoadModal
        isOpen={saveModal.isOpen}
        onClose={handleCloseSaveModal}
        gameTitle={saveModal.game?.title}
        onLoadSave={handleLoadSave}
        onStartNewGame={handleStartNewGame}
      />

      <LibraryHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onUpload={handleFileUpload}
      />
      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 sm:py-1">
        {filteredGames.length === 0 ? (
          <GameLibraryEmpty searchTerm={searchTerm} />
        ) : (
          <GameList games={filteredGames} onPlay={handlePlayGame} onDelete={handleDeleteGame} />
        )}
      </div>
    </section>
  );
}

export default LibraryPage;
