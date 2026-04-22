export default function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-navy/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[560px] max-h-[90%] overflow-y-auto rounded-t-[28px] sm:rounded-[20px] bg-card p-4 sm:p-6 transition-transform duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        {children}
      </div>
    </div>
  );
}

