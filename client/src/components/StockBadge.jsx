const VARIANTS = {
  red: {
    background: '#fcebeb',
    color: '#a32d2d',
    text: 'Low stock',
  },
  amber: {
    background: '#faeeda',
    color: '#854f0b',
    text: 'Refill soon',
  },
  green: {
    background: '#e1f5ee',
    color: '#0f6e56',
    text: 'In stock',
  },
};

export default function StockBadge({ status }) {
  const v = VARIANTS[status] || VARIANTS.green;

  return (
    <span
      className="font-display inline-flex items-center justify-center tracking-[0.3px] px-[9px] py-[3px] rounded-[20px] text-[10px] font-bold"
      style={{
        background: v.background,
        color: v.color,
      }}
    >
      {v.text}
    </span>
  );
}
