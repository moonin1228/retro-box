const createRomFileReader = (inputEl) => {
  const el =
    inputEl ||
    document.getElementById("file") ||
    (() => {
      throw new Error("RomFileReader needs a valid <input type='file'> element.");
    })();

  let callback = null;

  const readFile = (file) => {
    if (!file) return;
    const fr = new FileReader();

    fr.onload = () => {
      if (callback) callback(new Uint8Array(fr.result));
    };
    fr.onerror = (e) => {
      console.error("Error reading file", e.target?.error?.code);
    };

    fr.readAsArrayBuffer(file);
  };

  const handleChange = (e) => readFile(e.target.files[0]);
  el.addEventListener("change", handleChange);

  return Object.freeze({
    setCallback: (cb) => (callback = cb),
    readFile,
    dispose: () => el.removeEventListener("change", handleChange),
  });
};

export default createRomFileReader;
