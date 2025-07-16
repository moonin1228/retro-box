import { useEffect, useState } from "react";

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

const defaultGames = [
  {
    id: 1,
    title: "Genesis",
    romPath: "/roms/Genesis.gb",
    romData: null,
  },
  {
    id: 2,
    title: "AntSoldiers",
    romPath: "/roms/AntSoldiers.gb",
    romData: null,
  },
  {
    id: 3,
    title: "tobudx",
    romPath: "/roms/tobudx.gb",
    romData: null,
  },
];

function useGameLibrary({ getRomCacheInfo, loadRomFromCache }) {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      setIsLoading(true);

      const presetGames = await Promise.all(
        defaultGames.map(async (game) => {
          const romData = game.romPath ? await loadPresetRom(game.romPath) : null;
          return { ...game, romData, isUserGame: false };
        }),
      );

      const cachedRoms = await getRomCacheInfo();
      const userGames = await Promise.all(
        cachedRoms.map(async ({ fileName, timestamp, size }) => {
          const romData = await loadRomFromCache(fileName);
          return {
            id: `${fileName}_${timestamp}`,
            title: fileName.replace(/\.(gb|gbc)$/i, ""),
            fileName,
            romData,
            isUserGame: true,
            timestamp,
            size,
          };
        }),
      );

      setGames([...presetGames, ...userGames]);
      setIsLoading(false);
    }

    loadGames();
  }, [defaultGames, getRomCacheInfo, loadRomFromCache]);

  return { games, isLoading, setGames };
}

export default useGameLibrary;
