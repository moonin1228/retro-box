import { useEffect } from "react";

import useGameInputStore from "@/stores/useGameInputStore.js";

function useGameBoyInputBinding(gameBoyRef) {
  useEffect(() => {
    if (gameBoyRef.current?.cpu) {
      gameBoyRef.current.cpu.input = {
        getInputMask: () => useGameInputStore.getState().inputMask,
      };
    }
  }, []);
}

export default useGameBoyInputBinding;
