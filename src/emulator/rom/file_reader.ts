export interface RomFileReader {
  setCallback(cb: (data: Uint8Array) => void): void;
  readFile(file: File | null | undefined): void;
  dispose(): void;
}

function isFileInput(el: Element | null): el is HTMLInputElement {
  return el instanceof HTMLInputElement && el.type === "file";
}

export default function createRomFileReader(inputElement: Element | null = null): RomFileReader {
  const candidate = inputElement ?? document.getElementById("file");
  if (!isFileInput(candidate)) {
    throw new Error("[fileReader] rom 파일형태의 파일이 필요합니다.");
  }
  const el: HTMLInputElement = candidate;

  let callback: ((data: Uint8Array) => void) | null = null;

  function readFile(file: File | null | undefined): void {
    if (!file) return;
    const fr = new FileReader();

    fr.onload = () => {
      const result = fr.result;
      if (result instanceof ArrayBuffer) {
        callback?.(new Uint8Array(result));
      } else {
        console.error("[fileReader] 파일 형식이 올바르지 않습니다.", typeof result);
      }
    };

    fr.onerror = (e: ProgressEvent<FileReader>) => {
      console.error("[fileReader] 파일을 읽는데 실패했습니다.", e.target?.error);
    };

    fr.readAsArrayBuffer(file);
  }

  function handleChange(e: Event): void {
    const target = e.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    readFile(file);
  }
  el.addEventListener("change", handleChange);

  return Object.freeze({
    setCallback: (cb: (data: Uint8Array) => void) => {
      callback = cb;
    },
    readFile,
    dispose: () => {
      el.removeEventListener("change", handleChange);
    },
  });
}
