import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRDisplay from '../components/QRDisplay';
import { getPatient, getQrData } from '../api/patientApi';

export default function QRPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, qr] = await Promise.all([getPatient(patientId), getQrData(patientId)]);
        if (!cancelled) {
          setPatient(p);
          setQrUrl(qr.qrUrl);
        }
      } catch {
        if (!cancelled) toast.error('Could not load QR');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  function promptBrightness() {
    toast('Increase screen brightness for easier scanning at the pharmacy.', { icon: '☀️' });
  }

  if (loading || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-slate-600">Loading QR…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12">
        <button
          type="button"
          onClick={promptBrightness}
          className="mb-6 text-sm text-teal-700 underline"
        >
          Tip: increase brightness before showing
        </button>
        <QRDisplay value={qrUrl} size={320} subtitle={patient.name} />
        <p className="mt-6 max-w-sm text-center text-xs text-slate-500 break-all">{qrUrl}</p>
        <Link
          to={`/dashboard?patient=${patientId}`}
          className="mt-10 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
