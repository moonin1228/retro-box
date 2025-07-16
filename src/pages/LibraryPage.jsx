import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import GameCart, { createGameCartFromFile } from "@/components/GameCart.jsx";
import SaveLoadModal from "@/components/modals/SaveLoadModal.jsx";
import Toast from "@/components/Toast.jsx";
import useRomCacheStore from "@/stores/useRomCacheStore.js";

const defaultGames = [
  {
    id: 1,
    title: "Genesis",
    romPath: "/roms/Genesis.gb",
    romData: null,
  },
];

async function loadPresetRom(romPath) {
  try {
    const response = await fetch(romPath);
    if (!response.ok) {
      throw new Error(`Failed to load ROM: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("프리셋 롬 로드 실패:", error);
    return null;
  }
}

function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
    </div>
  );
}

function LibraryPage() {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [saveModal, setSaveModal] = useState({ isOpen: false, game: null });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { getRomCacheInfo, loadRomFromCache, deleteRomFromCache } = useRomCacheStore();

  const location = useLocation();

  useEffect(() => {
    if (location.state?.shouldRefresh && !sessionStorage.getItem("refreshed")) {
      sessionStorage.setItem("refreshed", "true");
      window.location.reload();
    } else {
      sessionStorage.removeItem("refreshed");
    }
  }, [location.state]);

  useEffect(() => {
    async function loadGames() {
      setIsLoading(true);
      const presetGames = await Promise.all(
        defaultGames.map(async (game) => {
          if (game.romPath) {
            const romData = await loadPresetRom(game.romPath);
            return { ...game, romData, isUserGame: false };
          }
          return { ...game, isUserGame: false };
        }),
      );

      const cachedRoms = await getRomCacheInfo();
      const userGames = await Promise.all(
        cachedRoms.map(async (romInfo) => {
          const romData = await loadRomFromCache(romInfo.fileName);
          return {
            id: `${romInfo.fileName}_${romInfo.timestamp}`,
            title: romInfo.fileName.replace(/\.(gb|gbc)$/i, ""),
            fileName: romInfo.fileName,
            romData,
            isUserGame: true,
            timestamp: romInfo.timestamp,
            size: romInfo.size,
          };
        }),
      );

      setGames([...presetGames, ...userGames]);
      setIsLoading(false);
    }

    loadGames();
  }, []);

  useEffect(() => {
    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredGames(filtered);
  }, [games, searchTerm]);

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

  async function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handlePlayGame(game) {
    setSaveModal({ isOpen: true, game });
  }

  async function handleLoadSave(saveData) {
    navigateToGame(saveData);
  }

  function handleCloseSaveModal() {
    setSaveModal({ isOpen: false, game: null });
  }

  async function handleStartNewGame() {
    navigateToGame(null);
  }

  async function navigateToGame(saveData) {
    const game = saveModal.game;
    if (!game) return;

    let romData = game.romData;
    if (!romData && game.isUserGame && game.fileName) {
      romData = await loadRomFromCache(game.fileName);
    }

    navigate("/game", {
      state: { romData, gameTitle: game.title, saveData },
    });
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

      <input
        id="file"
        ref={fileInputRef}
        type="file"
        accept=".gb,.gbc"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="sticky top-0 z-30 border-b border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <h1 className="text-xl font-bold text-white sm:text-2xl">게임 라이브러리</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="게임 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 rounded-lg border border-white/20 bg-white/90 px-4 py-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-lg border border-violet-500 bg-purple-500 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95 sm:px-5"
                type="button"
              >
                <span className="text-lg">📁</span>
                <span className="text-sm sm:text-base">게임 추가</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 sm:py-12">
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white">
            <div className="mb-4 text-5xl sm:text-6xl">🎮</div>
            <h2 className="mb-2 text-xl font-bold sm:text-2xl">
              {searchTerm ? "검색 결과가 없습니다" : "게임이 없습니다"}
            </h2>
            <p className="mb-6 text-sm text-white/70 sm:text-base">
              {searchTerm ? "다른 검색어를 시도해보세요" : "게임 파일을 추가해보세요"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredGames.map((game) => (
              <GameCart
                key={game.id}
                romData={game.romData}
                title={game.title}
                onPlay={() => handlePlayGame(game)}
                onDelete={() => handleDeleteGame(game)}
                isUserGame={game.isUserGame}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LibraryPage;
