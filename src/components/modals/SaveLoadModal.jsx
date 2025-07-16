import { useEffect, useState } from "react";

import useSaveStore from "@/stores/useSaveStore.js";

function SaveLoadModal({ isOpen, onClose, gameTitle, onLoadSave, onStartNewGame }) {
  const [saves, setSaves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getSaveData, deleteSaveSlot } = useSaveStore();

  function normalizeTitle(text) {
    if (typeof text !== "string") return "";
    return text.trim().toLowerCase().replace(/\s+/g, "");
  }

  useEffect(() => {
    if (isOpen && gameTitle) {
      loadSaves();
    }
  }, [isOpen, gameTitle]);

  async function loadSaves() {
    setIsLoading(true);
    const game = normalizeTitle(gameTitle);
    const gameSaves = await getSaveData(game);
    setSaves(gameSaves);
    setIsLoading(false);
  }

  function handleLoadSave(saveData) {
    onLoadSave(saveData);
    onClose();
  }

  function handleStartNewGame() {
    onStartNewGame();
    onClose();
  }

  async function handleDeleteSave(slot) {
    const game = normalizeTitle(gameTitle);
    await deleteSaveSlot(game, slot);
    console.log("지움");
    await loadSaves();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-gray-900/70 transition-opacity"
        onClick={onClose}
        role="button"
        tabIndex={0}
      />

      <div className="relative z-10 w-[90%] max-w-md border-2 border-gray-800 bg-white p-6 shadow-xl">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-800">저장 파일 불러오기</h2>
          <p className="mt-2 text-sm text-gray-600">{gameTitle}</p>
        </div>

        <div className="mb-4 h-px bg-gray-300" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
          </div>
        ) : saves.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">💾</div>
            <p className="text-gray-600">저장된 파일이 없습니다.</p>
            <button
              onClick={handleStartNewGame}
              className="mt-4 rounded bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
              type="button"
            >
              새 게임 시작
            </button>
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {saves.map((save) => (
              <div
                key={`${save.slot}-${save.timestamp}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{save.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(save.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoadSave(save.data)}
                    className="rounded bg-purple-500 px-3 py-1 text-xs font-medium text-white hover:bg-purple-600"
                    type="button"
                  >
                    불러오기
                  </button>
                  <button
                    onClick={() => handleDeleteSave(save.slot)}
                    className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          {saves.length > 0 && (
            <button
              onClick={handleStartNewGame}
              className="border-2 border-green-500 bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
              type="button"
            >
              새 게임 시작
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-gray-400 bg-gray-200 px-6 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveLoadModal;
