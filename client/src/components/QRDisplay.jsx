import { QRCodeSVG } from 'qrcode.react';

export default function QRDisplay({ value, size = 280, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        <QRCodeSVG value={value} size={size} level="M" includeMargin />
      </div>
      {subtitle && <p className="text-center text-lg font-semibold text-slate-800">{subtitle}</p>}
    </div>
  );
}
