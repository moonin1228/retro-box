const createRom = (gameboy, reader) => {
  let data = null;

  const validate = (bytes) => {
    let hash = 0;
    for (let i = 0x134; i <= 0x14c; i++) hash = hash - bytes[i] - 1;
    return (hash & 0xff) === bytes[0x14d];
  };

  const addReader = (romReader) => {
    romReader.setCallback((bytes) => {
      if (!validate(bytes)) {
        gameboy.error("The file is not a valid Game Boy ROM.");
        return;
      }
      data = bytes;
      gameboy.startRom(instance);
    });
  };

  const instance = Object.freeze({
    addReader,
    getData: () => data,
  });

  if (reader) addReader(reader);

  return instance;
};

export default createRom;
