export const renderBlackScreen = (canvas) => {
  const canvasContext = canvas.getContext("2d");
  canvasContext.imageSmoothingEnabled = false;
  canvasContext.fillStyle = "#000000";
  canvasContext.fillRect(0, 0, 160, 144);
};
