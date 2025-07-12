import { FaRegTrashAlt } from "react-icons/fa";

import { extractGameTitle } from "@/emulator/util/romUtils.js";
import { loadRomFromCache, saveRomToCache } from "@/stores/useRomCacheStore.js";

function GameCart({ romData, title, onPlay, onDelete, isUserGame = false }) {
  const gameTitle = (romData && extractGameTitle(romData)) || title || "Unknown Game";

  const handlePlay = () => {
    if (onPlay && romData) onPlay(romData);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div
      className="group relative h-72 w-56 cursor-pointer transition-transform duration-200 select-none hover:scale-105 hover:shadow-2xl"
      onClick={handlePlay}
      tabIndex={0}
      role="button"
    >
      <img
        src="/images/cart.png"
        alt="게임팩"
        className="h-full w-full object-contain drop-shadow-lg"
        draggable={false}
      />

      {isUserGame && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600"
          type="button"
          title="게임 삭제"
        >
          <FaRegTrashAlt size={16} />
        </button>
      )}

      <div className="font-retro absolute top-24 left-29 z-5 flex h-23 w-31 -translate-x-1/2 flex-col items-center justify-center rounded-lg border border-gray-500 bg-black/40 py-1 text-center text-xs font-black tracking-widest text-white uppercase shadow-lg drop-shadow">
        <span className="rounded bg-white/40 px-0.5 py-0.5 [text-shadow:_2px_2px_0_#222,4px_4px_0_#000]">
          {gameTitle}
        </span>
      </div>

      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 justify-center">
        <div className="group relative">
          <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg">
              {romData ? "플레이 가능" : "롬 파일 필요"}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const createGameCartFromFile = async (file) => {
  const cachedRom = await loadRomFromCache(file.name);
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
    const cacheSaved = await saveRomToCache(file.name, romData);
    if (!cacheSaved) {
      console.warn("ROM 캐시 저장 실패, 게임은 정상 추가됩니다.");
    }
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
