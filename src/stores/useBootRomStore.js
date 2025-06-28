import { create } from "zustand";

const useBootRomStore = create((set) => ({
  bootActive: true,
  setBootActive: (active) => set({ bootActive: !!active }),
}));

export default useBootRomStore;
