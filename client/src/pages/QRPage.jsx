import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

import { getPatient, generatePatientOtp } from '../api/patientApi';
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
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const timerRef = useRef(null);

  const fetchOtp = async (patientId) => {
    setGeneratingOtp(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await generatePatientOtp(patientId);
      setOtp(res.otp);
      const expiryTime = new Date(res.expiresAt).getTime();
      const calculateSeconds = () => Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));

      const initialSeconds = calculateSeconds();
      setSecondsLeft(initialSeconds);

      timerRef.current = setInterval(() => {
        const left = calculateSeconds();
        setSecondsLeft(left);
        if (left <= 0) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate verification OTP');
    } finally {
      setGeneratingOtp(false);
    }
  };

  // Use production domain for QR code (change this to your actual Vercel URL)
  const PRODUCTION_URL = 'https://med-sync-yukti.vercel.app';

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
        if (!cancelled) {
          setPatient(data);
          await fetchOtp(activePatientId);
        }
      } catch {
        toast.error('Could not load QR');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activePatientId, navigate]);

  const qrValue = useMemo(() => {
    if (!patient?.qrToken) return '';
    // Always use production domain for QR code
    return `${PRODUCTION_URL}/pharma/${patient.qrToken}`;
  }, [patient]);

  const formatSecondsLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
        className="w-full text-center rounded-2xl bg-white border border-border p-[24px]"
        style={{ maxWidth: 360 }}
      >
        <div className="font-display text-[22px] font-bold tracking-[-0.4px] text-navy mb-[3px]">{patient.name}</div>
        <div className="font-body text-[13px] font-medium text-muted mb-[20px]">
          {formatRelation(patient.relation)} · Secure QR & OTP
        </div>

        <div className="flex justify-center mb-[20px]">
          <div style={{ borderRadius: 10, overflow: 'hidden' }} className="p-2 border border-border bg-white">
            <QRCodeCanvas
              value={qrValue}
              size={180}
              fgColor="#1a2540"
              bgColor="#ffffff"
              level="H"
            />
          </div>
        </div>

        {generatingOtp ? (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-mint mb-2" />
            <span className="text-xs text-muted">Securing OTP...</span>
          </div>
        ) : secondsLeft > 0 ? (
          <div className="mb-[20px]">
            <div className="text-xs font-semibold tracking-widest text-muted uppercase mb-2">Temporary OTP</div>
            <div className="flex gap-2 justify-center mb-3">
              {otp.split('').map((char, index) => (
                <div
                  key={index}
                  className="w-9 h-12 border-2 border-mint rounded-xl flex items-center justify-center text-xl font-bold text-navy bg-faint animate-fadeIn"
                >
                  {char}
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-mint-light text-navy rounded-full text-xs font-medium">
              <span className="font-bold font-mono text-mint">{formatSecondsLeft(secondsLeft)}</span>
              <span className="text-muted">remaining</span>
            </div>
          </div>
        ) : (
          <div className="mb-[20px] p-3 bg-red-light rounded-xl border border-red text-center animate-shake">
            <span className="text-xs font-bold text-red block mb-1">OTP Expired</span>
            <button
              onClick={() => fetchOtp(activePatientId)}
              className="mt-1 border border-red text-red rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-red-light transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              Regenerate OTP
            </button>
          </div>
        )}

        <div className="bg-mint-light rounded-[12px] px-[16px] py-[12px] text-[11px] font-body text-navy leading-[1.5] mb-[20px]">
          The pharmacist scans the QR code, then verifies with the 6-digit OTP code to view your active medications & prescriptions safely.
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full bg-navy text-white rounded-full px-5 py-2.5 mb-[10px] text-[13px] font-bold tracking-[0.2px] cursor-pointer hover:opacity-90 transition-all"
        >
          Back to Dashboard
        </button>

        <button
          type="button"
          onClick={() => navigate(`/pharma/${patient.qrToken}`)}
          className="w-full border border-border bg-white text-navy rounded-full px-5 py-2.5 text-[13px] font-bold tracking-[0.2px] flex justify-center items-center gap-[8px] cursor-pointer hover:bg-faint transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              stroke="#0D1B2A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="#0D1B2A" strokeWidth="2.5" />
          </svg>
          Preview Pharmacist View
        </button>
      </div>
    </div>
  );
}
