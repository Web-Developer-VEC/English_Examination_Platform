import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, AlertCircle, Trash2, X, Loader2 } from "lucide-react";

/**
 * Reusable custom confirmation / alert modal.
 * Replaces native browser window.confirm() and alert() dialogs with a themed, accessible UI.
 */
export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger" | "warning" | "info"
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading && onCancel) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isWarning = type === "warning";

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      style={{ zIndex: 999999 }}
      onClick={() => {
        if (!isLoading && onCancel) onCancel();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-center p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ICON HEADER */}
        <div className="relative mb-4 flex items-center justify-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${
              isDanger
                ? "bg-red-50 border-2 border-red-200 text-red-600"
                : isWarning
                ? "bg-amber-50 border-2 border-amber-200 text-amber-600"
                : "bg-blue-50 border-2 border-blue-200 text-[#7a1f2b]"
            }`}
          >
            {isDanger ? (
              <Trash2 size={26} className="text-red-600" />
            ) : isWarning ? (
              <AlertTriangle size={26} className="text-amber-600" />
            ) : (
              <AlertCircle size={26} className="text-[#7a1f2b]" />
            )}
          </div>

          {!isLoading && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute right-0 top-0 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* TITLE */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
          {title}
        </h3>

        {/* MESSAGE / CONTENT */}
        {message && (
          <div className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line font-medium px-2">
            {message}
          </div>
        )}

        {/* BUTTON ACTIONS */}
        <div className="flex items-center gap-3">
          {cancelText && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : isWarning
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#7a1f2b] hover:bg-[#5e1620]"
            }`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
