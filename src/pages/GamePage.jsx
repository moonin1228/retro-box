import GameBoyEmulator from "@/components/GameBoyEmulator.jsx";

function GamePage() {
  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-0 bg-[url('/images/mainBG.png')] bg-cover bg-center bg-no-repeat opacity-90" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8">
        <GameBoyEmulator />
      </div>
    </div>
  );
}

export default GamePage;
