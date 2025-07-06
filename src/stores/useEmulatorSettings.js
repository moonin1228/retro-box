import { create } from "zustand";

const useEmulatorSettings = create((set) => ({
  volume: 50,
  setVolume: (volume) => set({ volume }),
}));

export default useEmulatorSettings;
