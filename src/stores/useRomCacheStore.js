export const saveRomToCache = (fileName, romData) => {
  localStorage.setItem(`rom-${fileName}`, JSON.stringify(Array.from(romData)));
};

export const loadRomFromCache = (fileName) => {
  const cached = localStorage.getItem(`rom-${fileName}`);
  return cached ? new Uint8Array(JSON.parse(cached)) : null;
};
