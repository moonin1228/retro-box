import { useEffect } from "react";

import BUTTON_BITS from "@/constants/buttonBits.js";
import useGameInputStore from "@/stores/useGameInputStore.js";

const useGameInput = () => {
  const { pressButton, keyUpButton, inputMask } = useGameInputStore();

  const keyMap = {
    ArrowRight: BUTTON_BITS.RIGHT,
    ArrowLeft: BUTTON_BITS.LEFT,
    ArrowUp: BUTTON_BITS.UP,
    ArrowDown: BUTTON_BITS.DOWN,
    KeyX: BUTTON_BITS.A,
    KeyZ: BUTTON_BITS.B,
    Enter: BUTTON_BITS.START,
    ShiftRight: BUTTON_BITS.SELECT,
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      const bit = keyMap[event.code];
      if (bit === undefined) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.repeat) return;

      pressButton(bit);
    };

    const handleGlobalKeyUp = (event) => {
      const bit = keyMap[event.code];
      if (bit === undefined) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      keyUpButton(bit);
    };

    document.addEventListener("keydown", handleGlobalKeyDown, { capture: true, passive: false });
    document.addEventListener("keyup", handleGlobalKeyUp, { capture: true, passive: false });

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown, { capture: true });
      document.removeEventListener("keyup", handleGlobalKeyUp, { capture: true });
    };
  }, [pressButton, keyUpButton]);

  return inputMask;
};

export default useGameInput;
