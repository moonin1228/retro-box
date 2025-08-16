import { FaRegTrashAlt } from "react-icons/fa";

import { extractGameTitle } from "@/emulator/util/romUtils";
import useRomCacheStore from "@/stores/useRomCacheStore.js";

export async function createGameCartFromFile(file) {
  const romCacheStore = useRomCacheStore.getState();

  const cachedRom = await romCacheStore.loadRomFromCache(file.name);

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

    await romCacheStore.saveRomToCache(file.name, romData);

    return {
      romData,
      title: title || file.name,
      fileName: file.name,
    };
  } catch (err) {
    throw new Error(`파일 읽기 실패: ${err.message}`);
  }
}

function GameCart({ romData, title, onPlay, onDelete, isUserGame = false }) {
  const gameTitle = extractGameTitle(romData) || title || "Unknown Game";

  function handlePlay() {
    if (onPlay && romData) {
      onPlay(romData);
    }
  }

  function handleDelete(event) {
    event.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  }

  return (
    <div
      className="group relative h-30 w-40 cursor-pointer transition-transform duration-200 select-none hover:scale-105 hover:shadow-2xl sm:h-72 sm:w-44 md:h-80 md:w-52 lg:h-72 lg:w-56"
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
          <FaRegTrashAlt className="text-xl" />
        </button>
      )}

      <div className="font-retro absolute top-[33.5px] left-[82px] z-5 flex h-12.5 w-17 -translate-x-1/2 flex-col items-center justify-center rounded-lg border border-gray-500 bg-black/40 py-1 text-center text-[7px] font-black tracking-widest text-white uppercase shadow-lg drop-shadow sm:top-[110px] sm:h-16 sm:w-28 md:top-[115px] md:left-[108px] md:h-21 md:w-29 md:text-sm lg:top-[96px] lg:left-[116px] lg:h-23 lg:w-32">
        <span className="rounded px-1 py-1 text-[7px] [text-shadow:_1px_1px_0_#222,2px_2px_0_#000] sm:text-xs sm:[text-shadow:_2px_2px_0_#222,4px_4px_0_#000] md:text-sm">
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

export default GameCart;
