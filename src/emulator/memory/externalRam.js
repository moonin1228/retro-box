const createExternalRam = () => {
  const state = {
    gameName: "",
    externalRam: [],
    ramSize: 0,
    ramBankSize: 0,
    ramBank: 0,
  };

  const storageKey = () => `${state.gameName}_EXTERNALAM`;

  const loadRam = (gameName, size) => {
    state.gameName = gameName;
    state.ramSize = size;
    state.ramBankSize = size >= 0x2000 ? 8192 : 2048;

    const saved = localStorage.getItem(storageKey());
    if (saved === null) {
      state.externalRam = new Array(size).fill(0);
    } else {
      try {
        state.externalRam = JSON.parse(saved);
        if (state.externalRam.length !== size) {
          console.error("[RAM] 램 길이가 맞지 않습니다.");
          state.externalRam = new Array(size).fill(0);
        }
      } catch {
        console.error("[RAM] 에러가 발생하여 램을 초기화합니다.");
        state.externalRam = new Array(size).fill(0);
      }
    }
  };

  const setRamBank = (bank) => {
    state.ramBank = bank;
  };

  const write = (offset, value) => {
    state.externalRam[state.ramBank * 8192 + offset] = value & 0xff;
  };

  const read = (offset) => state.externalRam[state.ramBank * 8192 + offset] | 0;

  const save = () => {
    localStorage.setItem(storageKey(), JSON.stringify(state.externalRam));
  };

  const getData = () => ({
    ...state,
    externalRam: Array.from(state.externalRam),
  });

  const setData = (data) => {
    if (!data) return;
    state.gameName = data.gameName;
    state.ramSize = data.ramSize;
    state.ramBankSize = data.ramBankSize;
    state.ramBank = data.ramBank;
    state.externalRam = Array.from(data.externalRam);
  };

  return Object.freeze({
    loadRam,
    setRamBank,
    write,
    read,
    save,
    getData,
    setData,
  });
};

export default createExternalRam;
