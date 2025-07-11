import { extractGameTitle } from "@/emulator/util/romUtils.js";
import { loadRomFromCache, saveRomToCache } from "@/stores/useRomCacheStore.js";

function GameCart({ romData, title, onPlay }) {
  const gameTitle = (romData && extractGameTitle(romData)) || title || "Unknown Game";

  const handlePlay = () => {
    if (onPlay && romData) {
      onPlay(romData);
    }
  };

  return (
    <button
      className="m-2 flex h-48 w-44 cursor-pointer flex-col items-center rounded-lg border-2 border-gray-300 bg-gray-100 p-4 transition-transform duration-200 hover:scale-105"
      onClick={handlePlay}
      type="button"
    >
      <div className="mb-2 flex h-28 w-36 flex-col items-center justify-center rounded border-2 border-gray-500 bg-gradient-to-b from-gray-200 to-gray-400 p-2.5">
        <div className="mb-2.5 text-center text-sm leading-tight font-bold break-words text-gray-700">
          {gameTitle}
        </div>

        <div className="font-mono text-xs text-gray-500">GAME BOY</div>
      </div>

      <div className="text-center text-xs text-gray-500">
        {romData ? "플레이 가능" : "롬 파일 필요"}
      </div>
    </button>
  );
}

export const createGameCartFromFile = async (file) => {
  const cachedRom = loadRomFromCache(file.name);
  if (cachedRom) {
    const title = extractGameTitle(cachedRom);

    return {
      romData: cachedRom,
      title: title || file.name,
      fileName: file.name,
      fromCache: true,
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    const romData = new Uint8Array(arrayBuffer);
    const title = extractGameTitle(romData);

    saveRomToCache(file.name, romData);

    return {
      romData,
      title: title || file.name,
      fileName: file.name,
    };
  } catch (err) {
    throw new Error(`파일 읽기 실패: ${err.message}`);
  }
};

export default GameCart;
