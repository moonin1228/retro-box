import useBootRomStore from "@/stores/useBootRomStore.js";

export const bootRom = new Uint8Array(0x100);

export const { setBootActive } = useBootRomStore.getState();
export const isBootActive = () => useBootRomStore.getState().bootActive;

export const loadBootRom = (data) => {
  if (!(data instanceof Uint8Array) || data.length !== 0x100) {
    throw new Error("Boot ROM must be a 256‑byte Uint8Array");
  }
  bootRom.set(data);
};

export const disableBootRom = () => {
  setBootActive(false);
};

export const enableBootRom = () => {
  setBootActive(true);
};
