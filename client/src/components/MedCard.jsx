import StockBadge from './StockBadge';

function statusToColors(status) {
  if (status === 'red') {
    return { stripe: '#e84040', iconBg: '#fff0f0', iconColor: '#e84040', countColor: '#e84040' };
  }
  if (status === 'amber') {
    return { stripe: '#f5a623', iconBg: '#fff8ec', iconColor: '#f5a623', countColor: '#f5a623' };
  }
  return { stripe: '#27ae60', iconBg: '#edfaf3', iconColor: '#27ae60', countColor: '#0f1f3d' };
}

function MedicineIcon({ status, iconIdx }) {
  const c = statusToColors(status);

  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: c.iconColor,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  // 4-cycle prompt icons
  if (iconIdx % 4 === 1) {
    // Capsule
    return (
      <svg {...common} aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="5" stroke={c.iconColor} strokeWidth="2" fill="none" />
        <line x1="7" y1="12" x2="17" y2="12" stroke={c.iconColor} strokeWidth="2" />
      </svg>
    );
  }

  if (iconIdx % 4 === 2) {
    // Blister pack
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="4" stroke={c.iconColor} strokeWidth="2" fill="none" />
        <path d="M3 11h18" stroke={c.iconColor} strokeWidth="2" />
        <path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" stroke={c.iconColor} strokeWidth="2" />
      </svg>
    );
  }

  if (iconIdx % 4 === 3) {
    // Bottle
    return (
      <svg {...common} aria-hidden="true">
        <path d="M9 3h6l1 4H8l1-4z" stroke={c.iconColor} strokeWidth="2" />
        <path d="M8 7v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" stroke={c.iconColor} strokeWidth="2" fill="none" />
        <line x1="10" y1="11" x2="10" y2="17" stroke={c.iconColor} strokeWidth="2" />
        <line x1="14" y1="11" x2="14" y2="17" stroke={c.iconColor} strokeWidth="2" />
      </svg>
    );
  }

  // Pill with plus circle
  return (
    <svg {...common} aria-hidden="true">
      <path d="M10.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4.5" stroke={c.iconColor} strokeWidth="2" />
      <line x1="10" y1="14" x2="14" y2="14" stroke={c.iconColor} strokeWidth="2" />
      <line x1="12" y1="12" x2="12" y2="16" stroke={c.iconColor} strokeWidth="2" />
      <circle cx="17" cy="17" r="5" stroke={c.iconColor} strokeWidth="2" />
      <line x1="14.5" y1="17" x2="19.5" y2="17" stroke={c.iconColor} strokeWidth="2" />
    </svg>
  );
}

function RestockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MedCard({ medicine, index = 0, onRestock, onViewRx, onRemove, onEdit }) {
  const { stockStatus, daysLeft } = medicine;
  const c = statusToColors(stockStatus);

  const daysSupply = typeof daysLeft === 'number' && daysLeft > 99 ? '∞' : daysLeft;

  const iconBoxStyle = { background: c.iconBg };

  return (
    <article
      className="relative flex flex-col gap-[13px] overflow-hidden rounded-card border border-border bg-card p-[20px_18px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-card"
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.stripe, borderRadius: '16px 16px 0 0' }} />

      {/* SECTION 1: Card Top Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px]" style={iconBoxStyle}>
          <MedicineIcon status={stockStatus} iconIdx={index} />
        </div>

        <div className="shrink-0">
          <StockBadge status={stockStatus} />
        </div>
      </div>

      {/* SECTION 2: Medicine Name Block */}
      <div>
        <div className="mb-[2px] font-display text-[15px] font-bold leading-[1.25] text-navy">{medicine.name}</div>
        <div className="text-[12px] text-muted">
          {medicine.strength}
          {medicine.unit} · {medicine.instructions}
        </div>
        <div className="mt-[4px] text-[11px] text-faint">
          {medicine.frequencyPerDay}× daily · {medicine.dosePerIntake} tab/dose
        </div>
      </div>

      {/* SECTION 3: Stock Row */}
      <div className="flex items-end justify-between gap-4 py-[10px] border-y border-border">
        <div>
          <div className="font-display text-[24px] font-bold leading-[1] " style={{ color: c.countColor }}>
            {medicine.currentStock}
          </div>
          <div className="mt-[2px] text-[10px] text-faint">tablets left</div>
        </div>
        <div className="text-right">
          <div className="font-display text-[18px] font-bold leading-[1] text-navy">{daysSupply}</div>
          <div className="mt-[2px] text-[10px] text-faint">days supply</div>
        </div>
      </div>

      {/* SECTION 4: Action Buttons Row */}
      <div className="flex gap-[6px]">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-[4px] rounded-[8px] border border-border bg-transparent py-[7px] px-[4px] cursor-pointer transition-all text-[11px] font-medium text-muted"
          onClick={() => onRestock?.(medicine)}
          style={{ color: '#6b7a99' }}
        >
          <RestockIcon />
        </button>

        {medicine.prescriptionImgUrl ? (
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-[4px] rounded-[8px] border border-border bg-transparent py-[7px] px-[4px] cursor-pointer transition-all text-[11px] font-medium text-muted"
            onClick={() => onViewRx?.(medicine)}
            style={{ color: '#6b7a99' }}
          >
            <EyeIcon />
          </button>
        ) : null}

        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-[4px] rounded-[8px] border border-border bg-transparent py-[7px] px-[4px] cursor-pointer transition-all text-[11px] font-medium text-muted"
          onClick={() => onEdit?.(medicine)}
          style={{ color: '#6b7a99' }}
        >
          Edit
        </button>

        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-[4px] rounded-[8px] border border-border bg-transparent py-[7px] px-[4px] cursor-pointer transition-all text-[11px] font-medium text-muted"
          onClick={() => onRemove?.(medicine)}
          style={{ color: '#6b7a99' }}
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

