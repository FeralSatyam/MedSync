const colours = {
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

const labels = {
  red: 'Out of stock',
  yellow: 'Running low',
  green: 'In stock',
};

export default function StockBadge({ status, daysLeft }) {
  const dayLabel =
    daysLeft === Infinity || daysLeft == null
      ? ''
      : ` · ~${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colours[status] || colours.green}`}
    >
      {labels[status] || 'In stock'}
      {dayLabel}
    </span>
  );
}
