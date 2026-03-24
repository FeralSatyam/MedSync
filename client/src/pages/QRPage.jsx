import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

import { getPatient } from '../api/patientApi';
import { useAppStore } from '../store/appStore';

function formatRelation(rel) {
  if (!rel) return '';
  return rel.charAt(0).toUpperCase() + rel.slice(1);
}

export default function QRPage() {
  const navigate = useNavigate();
  const activePatientId = useAppStore((s) => s.activePatientId);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!activePatientId) {
          navigate('/dashboard');
          return;
        }
        const data = await getPatient(activePatientId);
        if (!cancelled) setPatient(data);
      } catch {
        toast.error('Could not load QR');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePatientId, navigate]);

  const qrValue = useMemo(() => {
    if (!patient?.qrToken) return '';
    return `${window.location.origin}/pharma/${patient.qrToken}`;
  }, [patient]);

  if (loading || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-mint" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-[24px] py-[36px]">
      <div
        className="w-full text-center rounded-[22px] bg-card border border-border p-[34px]"
        style={{ maxWidth: 350, boxShadow: '0 8px 40px rgba(15,31,61,0.14)' }}
      >
        <div className="font-display text-[20px] font-bold text-navy mb-[3px]">{patient.name}</div>
        <div className="text-[12px] text-muted mb-[24px]">
          {formatRelation(patient.relation)} · QR Code
        </div>

        <div className="flex justify-center mb-[20px]">
          <div style={{ borderRadius: 10, overflow: 'hidden' }}>
            <QRCodeCanvas
              value={qrValue}
              size={200}
              fgColor="#0f1f3d"
              bgColor="#ffffff"
              level="H"
            />
          </div>
        </div>

        <div className="bg-mint-light rounded-[10px] px-[15px] py-[12px] text-[12px] text-navy leading-[1.65] mb-[16px]">
          The pharmacist scans this QR and instantly sees your full medicine list, exact dosages and doctor's
          prescription — no verbal communication needed.
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full bg-navy text-white rounded-[10px] px-[11px] py-[11px] mb-[9px] text-[13px] font-medium cursor-pointer hover:bg-navy-mid transition-all"
        >
          Back to Dashboard
        </button>

        <button
          type="button"
          onClick={() => navigate(`/pharma/${patient.qrToken}`)}
          className="w-full rounded-[10px] border border-border bg-transparent px-[18px] py-[9px] text-[12px] font-medium text-navy flex justify-center items-center gap-[7px] cursor-pointer hover:bg-[#f7f9ff] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              stroke="#0f1f3d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="#0f1f3d" strokeWidth="2" />
          </svg>
          Preview Pharmacist View
        </button>
      </div>
    </div>
  );
}
