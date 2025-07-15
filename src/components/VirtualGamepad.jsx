import BUTTON_BITS from "@/constants/buttonBits.js";
import useGameInputStore from "@/stores/useGameInputStore.js";

function VirtualGamepad() {
  const { pressButton, keyUpButton } = useGameInputStore();

  const bindTouch = (bit) => ({
    onTouchStart: () => pressButton(bit),
    onTouchEnd: () => keyUpButton(bit),
    onMouseDown: () => pressButton(bit),
    onMouseUp: () => keyUpButton(bit),
    onMouseLeave: () => keyUpButton(bit),
  });

  return (
    <>
      <div className="fixed bottom-20 left-4 flex flex-col items-center gap-2 md:hidden">
        <button {...bindTouch(BUTTON_BITS.UP)} className="dpad-btn" type="button">
          ↑
        </button>
        <div className="flex gap-2">
          <button {...bindTouch(BUTTON_BITS.LEFT)} className="dpad-btn" type="button">
            ←
          </button>
          <button {...bindTouch(BUTTON_BITS.DOWN)} className="dpad-btn" type="button">
            ↓
          </button>
          <button {...bindTouch(BUTTON_BITS.RIGHT)} className="dpad-btn" type="button">
            →
          </button>
        </div>
      </div>
      <div className="fixed right-4 bottom-20 flex flex-col items-center gap-2 md:hidden">
        <div className="relative h-[80px] w-[80px]">
          <button
            {...bindTouch(BUTTON_BITS.B)}
            className="ab-btn absolute bottom-0 left-0 translate-x-[-10px] translate-y-[10px]"
            type="button"
          >
            B
          </button>
          <button
            {...bindTouch(BUTTON_BITS.A)}
            className="ab-btn absolute top-0 right-0 translate-x-[10px] translate-y-[-10px]"
            type="button"
          >
            A
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 gap-4 md:hidden">
        <button {...bindTouch(BUTTON_BITS.SELECT)} className="system-btn" type="button">
          SELECT
        </button>
        <button {...bindTouch(BUTTON_BITS.START)} className="system-btn" type="button">
          START
        </button>
      </div>
    </>
  );
}

export default VirtualGamepad;
