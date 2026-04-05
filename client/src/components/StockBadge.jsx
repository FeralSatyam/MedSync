const VARIANTS = {
  red: {
    background: '#fff0f0',
    color: '#e84040',
    text: 'Out of stock',
  },
  amber: {
    background: '#fff8ec',
    color: '#9a6200',
    text: 'Running low',
  },
  green: {
    background: '#edfaf3',
    color: '#27ae60',
    text: 'In stock',
  },
};

export default function StockBadge({ status }) {
  const v = VARIANTS[status] || VARIANTS.green;

  return (
    <span
      style={{
        padding: '3px 9px',
        borderRadius: '99px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: v.background,
        color: v.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {v.text}
    </span>
  );
}
