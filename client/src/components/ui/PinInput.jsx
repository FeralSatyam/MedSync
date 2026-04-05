import { useMemo, useRef, useState } from 'react';

export default function PinInput({ value = '', onChange, error }) {
  const digits = useMemo(() => new Array(4).fill(''), []);
  const inputRefs = useRef([]);
  const [internal, setInternal] = useState(() => value.padEnd(4, '').slice(0, 4).split(''));

  function commit(nextDigits) {
    setInternal(nextDigits);
    const pin = nextDigits.join('').replace(/\D/g, '');
    onChange?.(pin);
  }

  function setDigit(i, ch) {
    const next = [...internal];
    next[i] = ch;
    commit(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {digits.map((_, i) => {
          const d = internal[i] || '';
          return (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              type="password"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              className="h-[60px] w-[52px] rounded-xl border-2 border-border text-center text-2xl font-extrabold tracking-widest outline-none focus:border-mint"
              onChange={(e) => {
                const ch = (e.target.value || '').replace(/\D/g, '').slice(-1);
                setDigit(i, ch);
                if (ch && i < 3) inputRefs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !d && i > 0) inputRefs.current[i - 1]?.focus();
              }}
            />
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs text-red">{error}</p> : null}
    </div>
  );
}

