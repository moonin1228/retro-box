export interface RomReader {
  setCallback(cb: (data: Uint8Array) => void): void;
}

export interface GameBoyInterfaceForRom {
  error: (msg: string) => void;
  startRom: (rom: RomInstance) => void;
}

export interface RomInstance {
  addReader: (romReader: RomReader) => void;
  getData: () => Uint8Array | null;
}

function validateHeaderChecksum(bytes: Uint8Array): boolean {
  let hash = 0;
  for (let i = 0x134; i <= 0x14c; i++) hash = hash - bytes[i] - 1;
  return (hash & 0xff) === bytes[0x14d];
}

function createRom(gameboy: GameBoyInterfaceForRom, reader: RomReader | null): RomInstance {
  let data: Uint8Array | null = null;

  const addReader = (romReader: RomReader): void => {
    romReader.setCallback((bytes: Uint8Array) => {
      if (!validateHeaderChecksum(bytes)) {
        gameboy.error("이 파일은 유효한 파일이 아닙니다.");
        return;
      }
      data = bytes;
      gameboy.startRom(instance);
    });
  };

  const instance: RomInstance = Object.freeze({
    addReader,
    getData: () => data,
  });

  if (reader) addReader(reader);

  return instance;
}

export default createRom;
