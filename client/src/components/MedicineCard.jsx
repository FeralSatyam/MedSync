import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';
import { getStockStatus } from '../utils/stockUtils';

export default function MedicineCard({ medicine, patientId, onRestock }) {
  const { status, daysLeft } = getStockStatus(medicine);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{medicine.name}</h3>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
            <span aria-hidden="true">💊</span>
            {medicine.strength} · {medicine.frequencyPerDay}× daily · {medicine.dosePerIntake} per dose
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Stock: <strong>{medicine.currentStock}</strong> units
          </p>
        </div>
        <StockBadge status={status} daysLeft={daysLeft} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => onRestock(medicine)}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Restock
        </button>
        <Link
          to={`/dashboard/medicine/${medicine._id}/edit?patientId=${patientId}`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
