import { FiX } from "react-icons/fi";

import KeyboardSetting from "@/components/setting/KeyboardSetting.jsx";
import SaveSetting from "@/components/setting/SaveSetting.jsx";
import VolumeSetting from "@/components/setting/VolumeSetting.jsx";

function SettingsPanel({ onClose, isOpen }) {
  return (
    <div
      className={`setting-panel fixed top-0 right-0 z-50 h-full w-96 transform cursor-default overflow-y-auto bg-black/30 p-6 text-white shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out select-none ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <section className="flex items-center justify-between border-b border-white/20 pb-4">
        <h2 className="text-lg tracking-tight">설정</h2>
        <button
          onClick={onClose}
          type="button"
          aria-label="설정 닫기"
          className="cursor-pointer rounded-lg border border-white/20 bg-white/5 p-1.5 transition-colors hover:bg-white/10"
        >
          <FiX className="h-5 w-5" />
        </button>
      </section>

      <div className="mt-6 space-y-8">
        <VolumeSetting />
        <KeyboardSetting />
        <SaveSetting />
      </div>
    </div>
  );
}

export default SettingsPanel;
