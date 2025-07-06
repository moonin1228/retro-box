import { create } from "zustand";

const useGameStatus = create((set) => ({
  isGamePause: false,

  togglePause: () =>
    set((state) => ({
      isGamePause: !state.isGamePause,
    })),
}));

export default useGameStatus;
