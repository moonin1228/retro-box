import { useEffect, useRef } from "react";

import { renderBlackScreen } from "../emulator/ppu/renderer.js";

function GameBoyScreen() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderBlackScreen(canvasRef.current);
    }
  }, []);
  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={144}
      className="image-render-pixelated h-[288px] w-[320px]"
    />
  );
}

export default GameBoyScreen;
