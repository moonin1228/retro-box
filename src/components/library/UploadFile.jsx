import { useRef } from "react";

function UploadFile({ onUpload }) {
  const fileInputRef = useRef(null);

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    fileInputRef.current.value = "";
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center justify-center gap-2 rounded-lg border border-violet-500 bg-purple-500 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95 sm:px-5"
        type="button"
      >
        <span className="text-lg">📁</span>
        <span className="text-sm sm:text-base">게임 추가</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".gb,.gbc"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

export default UploadFile;
