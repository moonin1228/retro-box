import { useEffect } from "react";

function useAutoSave(gameBoyRef, autoSave) {
  useEffect(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.updateAutoSaveSettings?.(autoSave);
    }
  }, [autoSave]);
}

export default useAutoSave;
