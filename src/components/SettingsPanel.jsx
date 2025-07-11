import { useState } from "react";
import { FiSave, FiVolume2, FiX } from "react-icons/fi";
import { IoGameControllerOutline } from "react-icons/io5";

import BUTTON_BITS from "@/constants/buttonBits.js";
import { loadCurrentState, saveCurrentState } from "@/emulator/util/saveUtils.js";
import useEmulatorSettings from "@/stores/useEmulatorSettings.js";
import useGameInputStore from "@/stores/useGameInputStore.js";

const BUTTON_LABELS = {
  RIGHT: "오른쪽",
  LEFT: "왼쪽",
  UP: "위",
  DOWN: "아래",
  A: "A 버튼",
  B: "B 버튼",
  START: "START",
  SELECT: "SELECT",
};

const formatKeyCode = (keyCode) => {
  if (!keyCode) return "미설정";

  const keyMap = {
    Arrow: "↑↓←→",
    Key: "",
    Digit: "",
    Shift: "Shift",
    Control: "Ctrl",
    Alt: "Alt",
    Space: "Space",
    Enter: "Enter",
    Backspace: "Backspace",
    Tab: "Tab",
    Escape: "Esc",
  };

  let formatted = keyCode;
  Object.entries(keyMap).forEach(([key, value]) => {
    if (value) {
      formatted = formatted.replace(key, value);
    } else {
      formatted = formatted.replace(key, "");
    }
  });

  return formatted;
};

function SettingsPanel({ onClose, isOpen, gameBoyRef }) {
  const { volume, setVolume } = useEmulatorSettings();
  const { keyMap, setKey, resetKeys } = useGameInputStore();
  const [selectedButton, setSelectedButton] = useState(null);

  const getCurrentKeyForButton = (buttonName) => {
    const buttonBit = BUTTON_BITS[buttonName];
    return Object.entries(keyMap).find(([key, bit]) => bit === buttonBit)?.[0] || null;
  };

  const handleKeyPress = (e) => {
    e.preventDefault();

    if (selectedButton) {
      const currentKey = getCurrentKeyForButton(selectedButton);
      if (currentKey) {
        setKey(currentKey, e.code);
      }
      setSelectedButton(null);
    }
  };

  const handleSettingKey = (buttonName) => {
    setSelectedButton(buttonName);
  };

  const handleResetKeys = () => {
    resetKeys();
  };

  const handleSave = () => {
    if (gameBoyRef.current?.cpu) {
      saveCurrentState(gameBoyRef.current.cpu);
    }
  };

  const handleLoad = () => {
    if (gameBoyRef.current?.cpu) {
      loadCurrentState(gameBoyRef.current.cpu);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 transform cursor-default overflow-y-auto bg-black/30 p-6 font-['Press_Start_2P'] text-white shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out select-none ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
    >
      <div className="flex items-center justify-between border-b border-white/20 pb-4">
        <h2 className="text-lg tracking-tight">설정</h2>
        <button
          onClick={onClose}
          type="button"
          aria-label="설정 닫기"
          className="rounded-lg border border-white/20 bg-white/5 p-1.5 transition-colors hover:bg-white/10"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 space-y-8">
        <section className="space-y-4 rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
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
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </section>

        <div className="cursor-default space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <IoGameControllerOutline className="h-4 w-4" />
              <span>키보드 설정</span>
            </div>
            <button
              type="button"
              onClick={handleResetKeys}
              className="ml-auto rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs transition-all hover:bg-white/10 focus:outline-none"
            >
              기본값으로 초기화
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.entries(BUTTON_LABELS).map(([buttonName, label]) => (
              <button
                key={buttonName}
                type="button"
                className={`group flex items-center rounded border px-4 py-3 text-sm transition-all ${
                  selectedButton === buttonName
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => handleSettingKey(buttonName)}
              >
                <div className="flex-1">
                  <div className="text-white/90">{label}</div>
                  <div className="mt-2 font-mono text-xs text-white/60">
                    {selectedButton === buttonName ? (
                      <span className="text-blue-400">키를 입력하세요...</span>
                    ) : (
                      formatKeyCode(getCurrentKeyForButton(buttonName))
                    )}
                  </div>
                </div>
                <div
                  className={`ml-4 rounded border px-3 py-1.5 text-xs transition-all ${
                    selectedButton === buttonName
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-white/20 bg-white/5 text-white/60 group-hover:bg-white/10"
                  }`}
                >
                  {selectedButton === buttonName ? "입력 대기" : "변경"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-4 rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-sm">
            <FiSave className="h-4 w-4" />
            <span>세이브 파일</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs transition-all hover:bg-white/10"
            >
              저장하기
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs transition-all hover:bg-white/10"
              onClick={handleLoad}
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
