import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import GameCart, { createGameCartFromFile } from "@/components/GameCart.jsx";
import SaveModal from "@/components/SaveModal.jsx";
import useSaveStore from "@/stores/useSaveStore.js";

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

function LibraryPage() {
  const [games, setGames] = useState(defaultGames);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { setCurrentSlot } = useSaveStore();

  useEffect(() => {
    const loadPresetRoms = async () => {
      const presetGames = await Promise.all(
        defaultGames.map(async (game) => {
          if (game.romPath) {
            const romData = await loadPresetRom(game.romPath);
            return { ...game, romData };
          }
          return game;
        }),
      );

      const userGames = JSON.parse(localStorage.getItem(USER_GAMES_KEY) || "[]").map((game) => ({
        ...game,
        romData: new Uint8Array(game.romData),
      }));

      setGames([...presetGames, ...userGames]);
    };

    loadPresetRoms();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const gameData = await createGameCartFromFile(file);

      const newGame = {
        id: Date.now(),
        title: gameData.title,
        fileName: gameData.fileName,
        romData: Array.from(gameData.romData),
        romPath: null,
      };

      const uploadedGames = JSON.parse(localStorage.getItem(USER_GAMES_KEY) || "[]");
      const updatedUserGames = [...uploadedGames, newGame];
      localStorage.setItem(USER_GAMES_KEY, JSON.stringify(updatedUserGames));

      setGames((prevGames) => [
        ...prevGames,
        { ...newGame, romData: new Uint8Array(newGame.romData) },
      ]);
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      alert("파일 업로드에 실패했습니다.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePlayGame = (game) => {
    if (game.romData) {
      setSelectedGame(game);
      setIsModalOpen(true);
    } else {
      alert("이 게임은 플레이할 수 없습니다.");
    }
  };

  const handleSlotSelect = (slot) => {
    setCurrentSlot(slot);
    navigate("/game", {
      state: {
        romData: selectedGame.romData,
        gameTitle: selectedGame.title,
      },
    });
  };

  return (
    <section className="relative h-screen w-full bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat select-none">
      <input
        id="file"
        ref={fileInputRef}
        type="file"
        accept=".gb,.gbc"
        onChange={handleFileUpload}
        className="hidden"
      />
      <div className="fixed top-4 left-1/2 z-30 -translate-x-1/2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-md hover:bg-gray-50 focus:ring-2 focus:outline-none"
          type="button"
        >
          📁 게임 파일 추가
        </button>
      </div>

      <div className="flex h-full items-center justify-center gap-6 pt-10">
        {games.map((game) => (
          <GameCart
            key={game.id}
            romData={game.romData}
            title={game.title}
            onPlay={() => handlePlayGame(game)}
          />
        ))}
      </div>

      <SaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gameTitle={selectedGame?.title}
        onSlotSelect={handleSlotSelect}
      />
    </section>
  );
}

export default LibraryPage;
