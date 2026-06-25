import StockBadge from './StockBadge';
import { stockUnitLabel } from '../utils/medicineUnits';

function statusToColors(status) {
  if (status === 'red') {
    return { iconBg: '#e24b4a', iconColor: '#ffffff', trackColor: '#eef1f7', barColor: '#e24b4a' };
  }
  if (status === 'amber') {
    return { iconBg: '#e6f1fb', iconColor: '#1a2540', trackColor: '#eef1f7', barColor: '#ef9f27' };
  }
  return { iconBg: '#e6f1fb', iconColor: '#1a2540', trackColor: '#eef1f7', barColor: '#1d9e75' };
}

function MedicineIcon({ status, iconIdx }) {
  const c = statusToColors(status);

  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: c.iconColor,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (iconIdx % 4 === 1) {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="5" stroke={c.iconColor} />
        <line x1="7" y1="12" x2="17" y2="12" stroke={c.iconColor} />
      </svg>
    );
  }
  if (iconIdx % 4 === 2) {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="4" stroke={c.iconColor} />
        <path d="M3 11h18" stroke={c.iconColor} />
        <path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" stroke={c.iconColor} />
      </svg>
    );
  }
  if (iconIdx % 4 === 3) {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M9 3h6l1 4H8l1-4z" stroke={c.iconColor} />
        <path d="M8 7v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" stroke={c.iconColor} />
        <line x1="10" y1="11" x2="10" y2="17" stroke={c.iconColor} />
        <line x1="14" y1="11" x2="14" y2="17" stroke={c.iconColor} />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path d="M10.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4.5" stroke={c.iconColor} />
      <line x1="10" y1="14" x2="14" y2="14" stroke={c.iconColor} />
      <line x1="12" y1="12" x2="12" y2="16" stroke={c.iconColor} />
      <circle cx="17" cy="17" r="5" stroke={c.iconColor} />
      <line x1="14.5" y1="17" x2="19.5" y2="17" stroke={c.iconColor} />
    </svg>
  );
}

function RestockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getFrequencyTags(freq) {
  const f = Number(freq);
  if (f === 1) return [{ label: 'Morning', bg: '#e1f5ee', color: '#0f6e56' }];
  if (f === 2) return [
    { label: 'Morning', bg: '#e1f5ee', color: '#0f6e56' },
    { label: 'Night', bg: '#f5e1e1', color: '#6e0f0f' }
  ];
  if (f >= 3) return [
    { label: 'Morning', bg: '#e1f5ee', color: '#0f6e56' },
    { label: 'Noon', bg: '#e1f5ee', color: '#0f6e56' },
    { label: 'Night', bg: '#e1f5ee', color: '#0f6e56' } // Assuming green for noon/night in figma for amoxicillin
  ];
  return [{ label: 'Morning', bg: '#e1f5ee', color: '#0f6e56' }];
}

export default function MedCard({ medicine, index = 0, onRestock, onViewRx, onRemove, onEdit }) {
  const { stockStatus, daysLeft } = medicine;
  const c = statusToColors(stockStatus);

  const daysSupply = typeof daysLeft === 'number' && daysLeft > 99 ? '∞' : daysLeft;
  
  // Calculate percentage for progress bar (assuming max standard is 30 days)
  let pct = 100;
  if (typeof daysLeft === 'number' && daysLeft <= 30) {
    pct = Math.max(5, (daysLeft / 30) * 100);
  }

  const tags = getFrequencyTags(medicine.frequencyPerDay);

  const formatFreqStr = (f) => {
    const num = Number(f);
    if (num === 1) return 'Once daily';
    if (num === 2) return 'Twice daily';
    if (num === 3) return 'Three times daily';
    return `${num} times daily`;
  };

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[20px] border border-border bg-card p-[16px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-card">
      {/* Top Row */}
      <div className="flex items-start justify-between mb-[14px]">
        <div>
          <div className="font-display text-[14px] font-bold tracking-[-0.2px] text-navy mb-[3px]">{medicine.name}</div>
          <div className="font-body text-[11px] font-medium text-muted">
            {medicine.strength}{medicine.unit} · {formatFreqStr(medicine.frequencyPerDay)}
          </div>
        </div>
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" style={{ background: c.iconBg }}>
          <MedicineIcon status={stockStatus} iconIdx={index} />
        </div>
      </div>

      {/* Badge */}
      <div className="mb-[8px]">
        <StockBadge status={stockStatus} />
      </div>

      {/* Stock Row & Bar */}
      <div className="mb-[4px] flex items-center justify-between text-[11px] font-body">
        <div className="font-medium text-muted">Stock left ({stockUnitLabel(medicine)})</div>
        <div className="font-bold text-navy">{medicine.currentStock}</div>
      </div>
      
      <div className="mb-[6px] h-[6px] w-full overflow-hidden rounded-[6px]" style={{ background: c.trackColor }}>
        <div className="h-full rounded-[6px]" style={{ width: `${pct}%`, background: c.barColor }} />
      </div>

      <div className="font-body text-[10px] text-muted mb-[12px]">{daysSupply} days left</div>

      {/* Times Row */}
      <div className="flex flex-wrap gap-[5px] border-t border-faint pt-[10px] mb-[12px]">
        {tags.map((t, i) => (
          <div key={i} className="rounded-[20px] px-[9px] py-[3px]" style={{ background: t.bg }}>
            <span className="font-body text-[10px] leading-[1.2] whitespace-nowrap" style={{ color: t.color }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-[4px] mt-auto">
        <button
          type="button"
          title="Restock"
          className="flex flex-1 items-center justify-center rounded-[8px] bg-bg py-[6px] transition-colors hover:bg-border text-muted cursor-pointer"
          onClick={() => onRestock?.(medicine)}
        >
          <RestockIcon />
        </button>
        {medicine.prescriptionImgUrl ? (
          <button
            type="button"
            title="View Prescription"
            className="flex flex-1 items-center justify-center rounded-[8px] bg-bg py-[6px] transition-colors hover:bg-border text-muted cursor-pointer"
            onClick={() => onViewRx?.(medicine)}
          >
            <EyeIcon />
          </button>
        ) : null}
        <button
          type="button"
          title="Edit"
          className="flex flex-1 items-center justify-center rounded-[8px] bg-bg py-[6px] transition-colors hover:bg-border text-muted cursor-pointer"
          onClick={() => onEdit?.(medicine)}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          title="Remove"
          className="flex flex-1 items-center justify-center rounded-[8px] bg-bg py-[6px] transition-colors hover:bg-red-light text-muted hover:text-red cursor-pointer"
          onClick={() => onRemove?.(medicine)}
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}


