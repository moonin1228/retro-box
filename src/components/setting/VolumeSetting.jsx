import { FiVolume2 } from "react-icons/fi";

import useEmulatorSettings from "@/stores/useEmulatorSettings.js";

function VolumeSetting() {
  const { volume, setVolume } = useEmulatorSettings();

  return (
    <section className="space-y-4 rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <FiVolume2 className="h-4 w-4" />
        <span>볼륨</span> <span>{volume}%</span>
      </div>
      <div className="space-y-4">
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
        />
        <div className="flex justify-between text-xs text-white/60">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </section>
  );
}

export default VolumeSetting;
