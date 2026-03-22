import { useState } from 'react';

export default function PrescriptionViewer({ url, alt = 'Prescription' }) {
  const [open, setOpen] = useState(false);
  if (!url) {
    return <p className="text-sm text-slate-500">No prescription image on file.</p>;
  }
  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('/raw/upload');
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-teal-700 underline hover:text-teal-900"
      >
        View prescription
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isPdf ? (
              <iframe title={alt} src={url} className="h-[80vh] w-full min-w-[min(100vw,800px)]" />
            ) : (
              <img src={url} alt={alt} className="max-h-[85vh] w-auto object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
