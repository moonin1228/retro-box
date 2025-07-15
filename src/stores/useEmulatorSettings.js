import { create } from "zustand";
import { persist } from "zustand/middleware";

const useEmulatorSettings = create(
  persist((set) => ({
    volume: 50,
    setVolume: (volume) => set({ volume }),
  })),
  {
    name: "game-volume-storage",
    partialize: (state) => ({ volume: state.volume }),
  },
);

export default useEmulatorSettings;
