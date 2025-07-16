import { useEffect, useRef } from "react";

function useVolumeUpdater(volume, gameBoyRef) {
  const volumeUpdateRef = useRef(null);

  useEffect(() => {
    if (volumeUpdateRef.current) {
      clearInterval(volumeUpdateRef.current);
    }

    const updateVolume = () => {
      if (!gameBoyRef.current) return;
      const gbVolume = Math.floor((volume / 100) * 4);
      const nr50Value = (gbVolume << 4) | gbVolume;
      gameBoyRef.current.cpu?.memory?.writeByte(0xff24, nr50Value);
    };

    updateVolume();
    volumeUpdateRef.current = setInterval(updateVolume, 1000 / 60);

    return () => {
      clearInterval(volumeUpdateRef.current);
    };
  }, [volume, gameBoyRef]);
}

export default useVolumeUpdater;
