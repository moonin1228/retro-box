import { useEffect } from "react";

function useVisibilityPause(gameBoyRef, isGamePause) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!gameBoyRef.current) return;

      if (document.hidden) {
        gameBoyRef.current.pause(true);
      } else if (!isGamePause) {
        gameBoyRef.current.pause(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isGamePause]);
}

export default useVisibilityPause;
