import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import GameCart, { createGameCartFromFile } from "@/components/GameCart.jsx";
import Toast from "@/components/Toast.jsx";

const defaultGames = [
  {
    id: 1,
    title: "Genesis",
    romPath: "/roms/Genesis.gb",
    romData: null,
  },
];

const USER_GAMES_KEY = "userUploadedGames";

const loadPresetRom = async (romPath) => {
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
};

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
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPresetRoms = async () => {
      setIsLoading(true);
      try {
        const presetGames = await Promise.all(
          defaultGames.map(async (game) => {
            if (game.romPath) {
              const romData = await loadPresetRom(game.romPath);
              return { ...game, romData, isUserGame: false };
            }
            return { ...game, isUserGame: false };
          }),
        );

        const userGames = JSON.parse(localStorage.getItem(USER_GAMES_KEY) || "[]").map((game) => ({
          ...game,
          romData: new Uint8Array(game.romData),
          isUserGame: true,
        }));

        const allGames = [...presetGames, ...userGames];
        setGames(allGames);
        setFilteredGames(allGames);
      } catch (error) {
        console.error("게임 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPresetRoms();
  }, []);

  useEffect(() => {
    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredGames(filtered);
  }, [games, searchTerm]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const gameData = await createGameCartFromFile(file);

      const newGame = {
        id: Date.now(),
        title: gameData.title,
        fileName: gameData.fileName,
        romData: Array.from(gameData.romData),
        romPath: null,
        isUserGame: true,
      };

      const uploadedGames = JSON.parse(localStorage.getItem(USER_GAMES_KEY) || "[]");
      const updatedUserGames = [...uploadedGames, newGame];
      localStorage.setItem(USER_GAMES_KEY, JSON.stringify(updatedUserGames));

      setGames((prevGames) => [
        ...prevGames,
        { ...newGame, romData: new Uint8Array(newGame.romData) },
      ]);

      setToast({
        isVisible: true,
        message: `${gameData.title} 게임이 추가되었습니다!`,
        type: "success",
      });
    } catch (error) {
      setToast({
        isVisible: true,
        message: "파일 업로드에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePlayGame = (game) => {
    if (game.romData) {
      navigate("/game", {
        state: {
          romData: game.romData,
          gameTitle: game.title,
        },
      });
    } else {
      setToast({
        isVisible: true,
        message: "게임을 플레이 할 수 없습니다.",
        type: "error",
      });
    }
  };

  const handleDeleteGame = (gameId) => {
    const gameToDelete = games.find((game) => game.id === gameId);
    const updatedGames = games.filter((game) => game.id !== gameId);
    setGames(updatedGames);

    const userGames = JSON.parse(localStorage.getItem(USER_GAMES_KEY) || "[]");
    const updatedUserGames = userGames.filter((game) => game.id !== gameId);
    localStorage.setItem(USER_GAMES_KEY, JSON.stringify(updatedUserGames));

    setToast({
      isVisible: true,
      message: `${gameToDelete?.title || "게임"}이 삭제되었습니다.`,
      type: "warning",
    });
  };

  return (
    <section className="relative min-h-screen w-full bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat select-none">
      {isLoading && <PageLoader />}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h1 className="text-2xl font-bold text-white">게임 라이브러리</h1>

            <div className="flex items-center gap-4">
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
                className="flex items-center gap-2 rounded-lg border border-violet-500 bg-purple-500 to-purple-700 px-5 py-2 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95"
                type="button"
              >
                <span className="text-lg">📁</span>
                게임 추가
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white">
            <div className="mb-4 text-6xl">🎮</div>
            <h2 className="mb-2 text-2xl font-bold">
              {searchTerm ? "검색 결과가 없습니다" : "게임이 없습니다"}
            </h2>
            <p className="mb-6 text-white/70">
              {searchTerm ? "다른 검색어를 시도해보세요" : "게임 파일을 추가해보세요"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredGames.map((game) => (
              <GameCart
                key={game.id}
                romData={game.romData}
                title={game.title}
                onPlay={() => handlePlayGame(game)}
                onDelete={game.isUserGame ? () => handleDeleteGame(game.id) : null}
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
