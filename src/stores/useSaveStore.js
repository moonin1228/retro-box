import { create } from "zustand";

const useSaveState = create((set) => ({
  saveState: {},

  setSaveData: (data) => localStorage.setItem("savestate1", JSON.stringify(data)),
}));

export default useSaveState;
