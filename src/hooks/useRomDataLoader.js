import { useEffect } from "react";

function useRomDataLoader(romData, gameBoyRef) {
  useEffect(() => {
    if (romData && gameBoyRef.current) {
      gameBoyRef.current.loadRomData(romData);
    }
  }, [romData]);
}

export default useRomDataLoader;
