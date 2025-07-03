const createExtRam = () => {
  const state = {
    gameName: "",
    extRam: [],
    ramSize: 0,
    ramBankSize: 0,
    ramBank: 0,
  };

  const storageKey = () => `${state.gameName}_EXTRAM`;

  const loadRam = (gameName, size) => {
    state.gameName = gameName;
    state.ramSize = size;
    state.ramBankSize = size >= 0x2000 ? 8192 : 2048;

    const saved = localStorage.getItem(storageKey());
    if (saved === null) {
      state.extRam = new Array(size).fill(0);
    } else {
      try {
        state.extRam = JSON.parse(saved);
        if (state.extRam.length !== size) {
          console.error("Found RAM data but not matching expected size.");
          state.extRam = new Array(size).fill(0);
        }
      } catch {
        console.error("Corrupted RAM data; re-initializing.");
        state.extRam = new Array(size).fill(0);
      }
    }
  };

  const setRamBank = (bank) => {
    state.ramBank = bank;
  };

  const write = (offset, value) => {
    state.extRam[state.ramBank * 8192 + offset] = value & 0xff;
  };

  const read = (offset) => state.extRam[state.ramBank * 8192 + offset] | 0;

  const save = () => {
    localStorage.setItem(storageKey(), JSON.stringify(state.extRam));
  };

  return Object.freeze({ loadRam, setRamBank, write, read, save });
};

export default createExtRam;
