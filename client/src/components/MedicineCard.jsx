import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';
import { getStockStatus } from '../utils/stockUtils';

export default function MedicineCard({ medicine, patientId, onRestock }) {
  const { status, daysLeft } = getStockStatus(medicine);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{medicine.name}</h3>
          <p className="text-sm text-slate-600">
            {medicine.strength} · {medicine.frequencyPerDay}× daily · {medicine.dosePerIntake} per dose
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Stock: <strong>{medicine.currentStock}</strong> units
          </p>
        </div>
        <StockBadge status={status} daysLeft={daysLeft} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRestock(medicine)}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          Restock
        </button>
        <Link
          to={`/dashboard/medicine/${medicine._id}/edit?patientId=${patientId}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
