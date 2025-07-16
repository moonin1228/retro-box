import { FiSave } from "react-icons/fi";

import useSettingsStore from "@/stores/useSettingsStore.js";

function SaveSetting() {
  const { autoSave, setAutoSaveEnabled, setAutoSaveInterval } = useSettingsStore();

  return (
    <section className="mt-10 space-y-2 rounded border border-white/20 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <FiSave className="h-5 w-5" />
          <span>자동 저장</span>
        </div>
        <button
          onClick={() => {
            setAutoSaveEnabled(!autoSave.enabled);
          }}
          className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-300 ${
            autoSave.enabled ? "bg-blue-500" : "bg-gray-300"
          }`}
          type="button"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              autoSave.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {autoSave.enabled && (
        <div className="mt-2 flex items-center justify-between text-sm text-white/80">
          <label htmlFor="autosave-interval" className="pl-1">
            저장 주기
          </label>
          <select
            id="autosave-interval"
            value={autoSave.interval}
            onChange={(e) => {
              const newInterval = Number(e.target.value);
              setAutoSaveInterval(newInterval);
            }}
            className="cursor-pointer rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white focus:outline-none"
          >
            <option value={6000}>1분</option>
            <option value={300000}>5분</option>
            <option value={600000}>10분</option>
            <option value={1800000}>30분</option>
          </select>
        </div>
      )}
    </section>
  );
}

export default SaveSetting;
