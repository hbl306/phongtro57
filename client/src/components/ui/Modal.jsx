import React from "react";

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* box */}
      <div className="relative w-[min(560px,92vw)] rounded-2xl bg-white shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          {footer}
        </div>
      </div>
    </div>
  );
}
