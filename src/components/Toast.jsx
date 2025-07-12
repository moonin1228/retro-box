import React, { useEffect } from "react";

function Toast({ message, type = "success", isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : type === "warning"
          ? "bg-yellow-500"
          : "bg-blue-500";

  const icon =
    type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️";

  return (
    <div className="animate-slide-in fixed top-4 right-4 z-50">
      <div
        className={`${bgColor} flex items-center gap-3 rounded-lg px-6 py-3 text-white shadow-lg`}
      >
        <span className="text-lg">{icon}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/70 transition-colors hover:text-white"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
