import { getOpcodeProgress } from "@/emulator/cpu/opcodes.js";

const checkProgress = async () => {
  try {
    const progress = getOpcodeProgress();

    const info = `
      구현 진행률: ${progress.percentage}% (${progress.implemented}/${progress.total})<br>
      구현된 명령어: ${progress.opcodes.slice(0, 10).join(", ")}${progress.opcodes.length > 10 ? "..." : ""}
    `;

    const progressElement = document.getElementById("progress-info");
    if (progressElement) {
      progressElement.innerHTML = info;
    }

    console.log("구현 진행률:", progress);
    return progress;
  } catch (error) {
    console.error("진행률 확인 에러:", error);
    const progressElement = document.getElementById("progress-info");
    if (progressElement) {
      progressElement.innerHTML = "❌ 오류 발생 (콘솔 확인)";
    }
    return null;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("progress-btn");
  if (button) {
    button.addEventListener("click", checkProgress);
  }

  window.checkProgress = checkProgress;

  console.log("디버그 로드 완료");
});
