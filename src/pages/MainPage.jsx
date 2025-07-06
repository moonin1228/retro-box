import { useState } from "react";
import { useNavigate } from "react-router-dom";

function MainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();

  const handleGameStart = () => {
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate("/game"), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  return (
    <section className="relative h-screen w-full bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat">
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-20">
          <h1 className="] animate-pulse bg-gradient-to-r from-purple-500 to-pink-300 bg-clip-text text-7xl font-black tracking-widest text-transparent text-white uppercase drop-shadow-[0_0_20px_rgba(147,51,234,0.8)] select-none">
            레트로 박스
          </h1>

          {!isLoading ? (
            <button
              type="button"
              onClick={handleGameStart}
              className="/* ← 차분한 보라-핑크 */ rounded-lg border-4 border-white bg-gradient-to-r from-amber-400/80 via-rose-400/80 to-pink-500/80 px-8 py-4 text-xl font-bold tracking-wide text-white uppercase shadow-md transition-transform duration-200 select-none hover:scale-105 hover:shadow-fuchsia-500/40"
            >
              🎮 게임 시작
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-lg font-bold tracking-wide text-white uppercase select-none">
                LOADING...
              </div>
              <div className="h-8 w-80 overflow-hidden rounded-lg border-4 border-purple-400 bg-black shadow-[0_0_20px_rgba(147,51,234,0.6)]">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] transition-all duration-100 ease-out select-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm font-bold text-purple-400 select-none">{progress}%</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MainPage;
