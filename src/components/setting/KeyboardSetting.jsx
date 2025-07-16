import { useState } from "react";
import { IoGameControllerOutline } from "react-icons/io5";

import BUTTON_BITS from "@/constants/buttonBits.js";
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

function formatKeyCode(keyCode) {
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
}

function KeyboardSetting() {
  const [selectedButton, setSelectedButton] = useState(null);
  const { keyMap, resetKeys, setKey } = useGameInputStore();

  function getCurrentKeyForButton(buttonName) {
    const buttonBit = BUTTON_BITS[buttonName];
    return Object.entries(keyMap).find(([key, bit]) => bit === buttonBit)?.[0] || null;
  }

  function handleKeyPress(event) {
    if (!selectedButton) return;

    event.preventDefault();

    if (event.code === "Escape") {
      setSelectedButton(null);
      return;
    }

    const currentKey = getCurrentKeyForButton(selectedButton);
    if (currentKey) {
      setKey(currentKey, event.code);
    }

    setSelectedButton(null);
  }

  function handleSettingKey(buttonName) {
    setSelectedButton(buttonName);
  }

  function handleResetKeys() {
    resetKeys();
  }

  return (
    <section onKeyDown={handleKeyPress} tabIndex={0} role="button">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <IoGameControllerOutline className="h-4 w-4" />
          <span className="text-">키보드 설정</span>
        </div>
        <button
          type="button"
          onClick={handleResetKeys}
          className="ml-auto cursor-pointer rounded border border-white/20 bg-white/5 px-2 py-1 text-xs transition-all hover:bg-white/10 focus:outline-none"
        >
          초기화
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(BUTTON_LABELS).map(([buttonName, label]) => (
          <button
            key={buttonName}
            type="button"
            className={`group flex cursor-pointer flex-col items-center rounded border px-2 py-2 text-xs transition-all ${
              selectedButton === buttonName
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
            onClick={() => handleSettingKey(buttonName)}
          >
            <div className="text-center leading-tight text-white/90">{label}</div>
            <div className="mt-1 font-mono text-xs text-white/60">
              {selectedButton === buttonName ? (
                <span className="text-blue-400">입력...</span>
              ) : (
                formatKeyCode(getCurrentKeyForButton(buttonName))
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default KeyboardSetting;
