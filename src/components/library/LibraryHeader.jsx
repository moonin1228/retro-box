import UploadButton from "@/components/library/UploadFile.jsx";

function LibraryHeader({ searchTerm, setSearchTerm, onUpload }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/20 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-xl px-4 py-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <h1 className="text-xl font-bold text-white sm:text-2xl">게임 라이브러리</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="게임 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg border border-white/20 bg-white/90 px-4 py-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            <UploadButton onUpload={onUpload} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibraryHeader;
