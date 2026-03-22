const colours = {
  red: 'bg-red-100 text-red-800 border border-red-200',
  yellow: 'bg-amber-100 text-amber-800 border border-amber-200',
  green: 'bg-green-100 text-green-800 border border-green-200',
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[status] || colours.green}`}
    >
      {labels[status] || 'In stock'}
      {dayLabel}
    </span>
  );
}
