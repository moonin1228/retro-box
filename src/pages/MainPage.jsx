import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function MainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const beepRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!beepRef.current) {
    beepRef.current = new Audio("/sounds/coin.mp3");
    beepRef.current.preload = "auto";
    beepRef.current.volume = 0.3;
  }

  const navigate = useNavigate();

  const handleGameStart = () => {
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const audio = beepRef.current;
          audio.currentTime = 0;
          audio.play();
          clearInterval(interval);
          setTimeout(() => navigate("/library"), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  return (
    <section className="relative h-screen w-full bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-black/25 sm:bg-transparent" />
      <div className="flex h-screen items-center justify-center px-4">
        <div className="flex -translate-y-15 transform flex-col items-center gap-15 sm:translate-y-0 sm:gap-20">
          <h1 className="animate-pulse bg-gradient-to-r from-purple-500 to-pink-300 bg-clip-text text-5xl font-black tracking-widest text-transparent text-white uppercase drop-shadow-[0_0_20px_rgba(147,51,234,0.8)] select-none sm:text-6xl md:text-7xl">
            레트로 박스
          </h1>

          {!isLoading ? (
            <button
              type="button"
              onClick={handleGameStart}
              className="rounded-lg border-4 border-white bg-gradient-to-r from-amber-400/80 via-rose-400/80 to-pink-500/80 px-6 py-3 text-base font-bold tracking-wide text-white uppercase shadow-md transition-transform duration-200 select-none hover:scale-105 hover:shadow-fuchsia-500/40 sm:px-8 sm:py-4 sm:text-lg md:px-10 md:py-5 md:text-xl"
            >
              🎮 게임 시작
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5">
              <div className="text-base font-bold tracking-wide text-white uppercase select-none sm:text-lg">
                LOADING...
              </div>
              <div className="h-6 w-64 overflow-hidden rounded-lg border-4 border-purple-400 bg-black shadow-[0_0_20px_rgba(147,51,234,0.6)] sm:h-8 sm:w-80">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] transition-all duration-100 ease-out select-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm font-bold text-purple-400 select-none sm:text-base">
                {progress}%
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MainPage;
