import { FaDownload, FaPause, FaPlay } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { Tooltip } from "react-tooltip";

function EmulatorControls({ isGamePause, onSave, onPauseToggle, onLoad, size = "md" }) {
  const isMobile = size === "sm";

  const baseClass =
    "flex items-center justify-center rounded-md bg-[#dcd3cc] text-[#534d48] shadow-[inset_-2px_-2px_0px_#8b8781,inset_2px_2px_0px_#f3ede8] transition-all duration-200 hover:brightness-105 active:shadow-[inset_2px_2px_0px_#8b8781,inset_-2px_-2px_0px_#f3ede8]";

  const sizeClass = isMobile
    ? "h-7 w-7 text-xl md:h-11 md:w-11 lg:h-12 lg:w-12"
    : "h-10 w-10 text-2xl md:h-11 md:w-11 lg:h-12 lg:w-12";

  return (
    <div className={`flex gap-4 ${isMobile ? "-mt-3" : ""}`}>
      <button
        type="button"
        onClick={onSave}
        data-tooltip-id="emulator-tooltip"
        data-tooltip-content="현재 상태 저장하기"
        className={`${baseClass} ${sizeClass}`}
      >
        <IoIosSave className="text-3xl md:text-[34px] lg:text-[36px]" />
      </button>

      <button
        onClick={onPauseToggle}
        type="button"
        data-tooltip-id="emulator-tooltip"
        data-tooltip-content={isGamePause ? "게임 재개하기" : "게임 일시정지"}
        className={`${baseClass} ${sizeClass}`}
      >
        {isGamePause ? (
          <FaPlay className="text-xl md:text-2xl lg:text-[26px]" />
        ) : (
          <FaPause className="text-xl md:text-2xl lg:text-[26px]" />
        )}
      </button>

      <button
        type="button"
        onClick={onLoad}
        data-tooltip-id="emulator-tooltip"
        data-tooltip-content="저장된 상태 불러오기"
        className={`${baseClass} ${sizeClass}`}
      >
        <FaDownload className="text-xl md:text-[26px] lg:text-[28px]" />
      </button>

      {!isMobile && <Tooltip id="emulator-tooltip" place="top" />}
    </div>
  );
}

export default EmulatorControls;
