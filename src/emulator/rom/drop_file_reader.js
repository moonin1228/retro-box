const createRomDropFileReader = (dropZone) => {
  const el = dropZone || document.body;
  let callback = null;

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      readFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const readFile = (file) => {
    if (!file) return;
    const fr = new FileReader();

    fr.onload = () => {
      if (callback) callback(new Uint8Array(fr.result));
    };
    fr.onerror = (e) => {
      console.error("Error reading dropped file", e.target?.error?.code);
    };

    fr.readAsArrayBuffer(file);
  };

  el.addEventListener("drop", handleDrop);
  el.addEventListener("dragover", handleDragOver);

  return Object.freeze({
    setCallback: (cb) => (callback = cb),
    dispose: () => {
      el.removeEventListener("drop", handleDrop);
      el.removeEventListener("dragover", handleDragOver);
    },
  });
};

export default createRomDropFileReader;
