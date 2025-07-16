function GameLibraryEmpty({ searchTerm }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-white">
      <div className="mb-4 text-5xl sm:text-6xl">🎮</div>
      <h2 className="mb-2 text-xl font-bold sm:text-2xl">
        {searchTerm ? "검색 결과가 없습니다" : "게임이 없습니다"}
      </h2>
      <p className="mb-6 text-sm text-white/70 sm:text-base">
        {searchTerm ? "다른 검색어를 시도해보세요" : "게임 파일을 추가해보세요"}
      </p>
    </div>
  );
}

export default GameLibraryEmpty;
