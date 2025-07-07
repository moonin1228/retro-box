import { useEffect } from "react";

import useGameInputStore from "@/stores/useGameInputStore.js";

const useGameInput = () => {
  const { pressButton, keyUpButton, inputMask } = useGameInputStore();
  const store = useGameInputStore;

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      const { keyMap } = store.getState();
      const bit = keyMap[event.code];
      if (bit === undefined) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.repeat) return;
      pressButton(bit);
    };

    const handleGlobalKeyUp = (event) => {
      const { keyMap } = store.getState();
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
