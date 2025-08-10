export const colors: number[][] = [
  [0xff, 0xff, 0xff],
  [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55],
  [0x00, 0x00, 0x00],
];

export const physics: { WIDTH: number; HEIGHT: number; FREQUENCY: number } = {
  WIDTH: 160,
  HEIGHT: 144,
  FREQUENCY: 60,
};

export interface ScreenInstance {
  canvas: HTMLCanvasElement;
  setPixelSize(size: number): void;
  clearScreen(): void;
  render(buffer: number[]): void;
}

const createScreen = (canvas: HTMLCanvasElement, pixelSize: number = 1): ScreenInstance => {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  let state: { pixelSize: number; imageData: ImageData } = {
    pixelSize,
    imageData: new ImageData(1, 1),
  };

  const initImageData = (): void => {
    canvas.width = physics.WIDTH * state.pixelSize;
    canvas.height = physics.HEIGHT * state.pixelSize;

    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    state.imageData = img;
  };

  const setPixelSize = (size: number): void => {
    state.pixelSize = size;
    initImageData();
  };

  const clearScreen = (): void => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const fillImageData = (buffer: number[]): void => {
    const { pixelSize } = state;
    const { WIDTH, HEIGHT } = physics;
    const imgData = state.imageData.data;
    const canvasW = canvas.width;

    for (let y = 0; y < HEIGHT; y++) {
      for (let py = 0; py < pixelSize; py++) {
        const yOffset = (y * pixelSize + py) * canvasW;

        for (let x = 0; x < WIDTH; x++) {
          const rgb = colors[buffer[y * WIDTH + x] | 0];
          for (let px = 0; px < pixelSize; px++) {
            const idx = (yOffset + (x * pixelSize + px)) << 2;
            imgData[idx] = rgb[0];
            imgData[idx + 1] = rgb[1];
            imgData[idx + 2] = rgb[2];
          }
        }
      }
    }
  };

  const render = (buffer: number[]): void => {
    fillImageData(buffer);
    ctx.putImageData(state.imageData, 0, 0);
  };

  initImageData();

  return Object.freeze({
    canvas,
    setPixelSize,
    clearScreen,
    render,
  });
};

export default createScreen;


