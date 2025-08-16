type ExternalRamArray = number[];

interface ExternalRamState {
  gameName: string;
  externalRam: ExternalRamArray;
  ramSize: number;
  ramBankSize: number;
  ramBank: number;
}

export interface ExternalRamDataSnapshot {
  gameName: string;
  externalRam: ExternalRamArray;
  ramSize: number;
  ramBankSize: number;
  ramBank: number;
}

export interface ExternalRam {
  loadRam(gameName: string, size: number): void;
  setRamBank(bank: number): void;
  write(offset: number, value: number): void;
  read(offset: number): number;
  save(): void;
  getData(): ExternalRamDataSnapshot;
  setData(data: ExternalRamDataSnapshot): void;
}

function createExternalRam(): ExternalRam {
  const state: ExternalRamState = {
    gameName: "",
    externalRam: [],
    ramSize: 0,
    ramBankSize: 0,
    ramBank: 0,
  };

  const storageKey = (): string => `${state.gameName}_EXTERNALAM`;

  function loadRam(gameName: string, size: number): void {
    state.gameName = gameName;
    state.ramSize = size;
    state.ramBankSize = size >= 0x2000 ? 8192 : 2048;

    const saved = localStorage.getItem(storageKey());
    if (saved === null) {
      state.externalRam = new Array(size).fill(0);
    } else {
      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          state.externalRam = parsed as number[];
        } else {
          throw new Error("Invalid external RAM snapshot format");
        }
        if (state.externalRam.length !== size) {
          console.error("[RAM] 램 길이가 맞지 않습니다.");
          state.externalRam = new Array(size).fill(0);
        }
      } catch {
        console.error("[RAM] 에러가 발생하여 램을 초기화합니다.");
        state.externalRam = new Array(size).fill(0);
      }
    }
  }

  function setRamBank(bank: number): void {
    state.ramBank = bank;
  }

  function write(offset: number, value: number): void {
    state.externalRam[state.ramBank * 8192 + offset] = value & 0xff;
  }

  const read = (offset: number): number => state.externalRam[state.ramBank * 8192 + offset] | 0;

  function save(): void {
    localStorage.setItem(storageKey(), JSON.stringify(state.externalRam));
  }

  function getData(): ExternalRamDataSnapshot {
    return {
      gameName: state.gameName,
      externalRam: Array.from(state.externalRam),
      ramSize: state.ramSize,
      ramBankSize: state.ramBankSize,
      ramBank: state.ramBank,
    };
  }

  function setData(data: ExternalRamDataSnapshot): void {
    if (!data) return;
    state.gameName = data.gameName;
    state.ramSize = data.ramSize;
    state.ramBankSize = data.ramBankSize;
    state.ramBank = data.ramBank;
    state.externalRam = Array.from(data.externalRam);
  }

  return Object.freeze({
    loadRam,
    setRamBank,
    write,
    read,
    save,
    getData,
    setData,
  });
}

export default createExternalRam;
