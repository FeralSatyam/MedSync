import { useEffect, useMemo, useRef, useState } from 'react';

export default function UploadZone({ file, onFileChange, onRemove }) {
  const [localError, setLocalError] = useState('');

  const inputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const allowed = useMemo(
    () => new Set(['image/jpeg', 'image/png', 'application/pdf']),
    []
  );

  const maxBytes = 5 * 1024 * 1024;

  const previewUrl = useMemo(() => {
    if (!file) return null;
    if (!file.type?.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateAndSet(f) {
    setLocalError('');
    if (!f) return;

    if (!allowed.has(f.type)) {
      setLocalError('Invalid file. JPG, PNG, or PDF (max 5MB).');
      return;
    }
    if (f.size > maxBytes) {
      setLocalError('File too large. Max 5MB.');
      return;
    }
    onFileChange?.(f);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    validateAndSet(f);
    // Allow selecting the same file again.
    e.target.value = '';
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragActive(false);
    const f = e.dataTransfer?.files?.[0] || null;
    validateAndSet(f);
  }

  const isImage = file?.type?.startsWith('image/');

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') openPicker();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition ${
          isDragActive ? 'bg-bg' : 'bg-transparent'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="mx-auto flex flex-col items-center gap-2">
          <div className="text-faint">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-muted">Tap to upload prescription</p>
          <p className="text-[11px] text-faint">JPG, PNG, PDF — max 5MB</p>
        </div>
      </div>

      {localError ? <p className="mt-2 text-xs text-red">{localError}</p> : null}

      {file ? (
        <div className="mt-3">
          <div className="flex items-center gap-3">
            {isImage ? (
              <img
                src={previewUrl || ''}
                alt="Prescription preview"
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-bg border border-border text-faint">
                PDF
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-navy truncate">{file.name}</p>
              <p className="text-xs text-muted">{Math.round(file.size / 1024)} KB</p>
            </div>
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => onRemove?.()}
              className="rounded-xl border border-border px-3 py-2 text-sm font-bold text-navy active:scale-[0.98]"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

