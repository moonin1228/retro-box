import { FiSave, FiVolume2, FiX } from "react-icons/fi";
import { LuGamepad2 } from "react-icons/lu";

import useEmulatorSettings from "@/stores/useEmulatorSettings.js";

function SettingsPanel({ onClose, isOpen }) {
  const { volume, setVolume } = useEmulatorSettings();

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 transform overflow-y-auto bg-neutral-900 p-6 font-['Press_Start_2P'] text-white shadow-xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b-2 border-neutral-700 pb-4">
        <h2 className="text-lg tracking-tight">설정</h2>
        <button
          onClick={onClose}
          type="button"
          aria-label="설정 닫기"
          className="rounded-lg border-2 border-neutral-700 bg-neutral-800 p-1.5 transition-colors hover:bg-neutral-700"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 space-y-8">
        <section className="space-y-4 rounded-lg border-2 border-neutral-700 bg-neutral-800 p-4">
          <div className="flex items-center gap-2 text-sm">
            <FiVolume2 className="h-4 w-4" />
            <span>볼륨</span> <span>{volume}%</span>
          </div>
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-700"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border-2 border-neutral-700 bg-neutral-800 p-4">
          <div className="flex items-center gap-3 text-sm">
            <LuGamepad2 className="h-4 w-4" />
            <span>키보드 설정</span>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
            >
              초기화
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-blue-800 bg-blue-900 px-3 py-1 text-xs text-blue-200 transition-colors hover:bg-blue-800"
            >
              <FiSave className="h-3 w-3" />
              저장
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border-2 border-neutral-700 bg-neutral-800 p-4">
          <div className="flex items-center gap-3 text-sm">
            <FiSave className="h-4 w-4" />
            <span>세이브 파일</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-lg border border-emerald-800 bg-emerald-900 px-4 py-2 text-xs text-emerald-200 transition-colors hover:bg-emerald-800"
            >
              저장하기
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-800 bg-rose-900 px-4 py-2 text-xs text-rose-200 transition-colors hover:bg-rose-800"
            >
              불러오기
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPanel;
