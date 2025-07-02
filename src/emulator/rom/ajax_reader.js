const createRomAjaxReader = () => {
  let callback = null;

  const loadUrl = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      if (callback) callback(new Uint8Array(arrayBuffer));
    } catch (error) {
      console.error("Error loading ROM from URL:", error);
    }
  };

  return Object.freeze({
    setCallback: (cb) => (callback = cb),
    loadUrl,
  });
};

export default createRomAjaxReader;
