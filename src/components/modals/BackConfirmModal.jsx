function BackConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-gray-900/70 transition-opacity"
        onClick={onCancel}
        role="button"
        tabIndex={0}
      />

      <div className="relative z-10 w-[90%] max-w-md border-2 border-gray-800 bg-white p-6 shadow-xl">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-800">게임을 종료하시겠습니까?😢</h2>
        </div>

        <div className="mb-4 h-px bg-gray-300" />

        <p className="mb-6 text-center text-sm text-gray-600">
          저장하지 않은 게임 진행 상황이 모두 사라집니다.
        </p>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="border-2 border-gray-400 bg-gray-200 px-6 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300"
          >
            계속하기
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="border-2 border-purple-700 bg-violet-500 px-6 py-2 font-medium text-white transition-colors hover:bg-purple-800"
          >
            종료하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default BackConfirmModal;
