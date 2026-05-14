import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPharmacistData, dispense } from '../api/pharmacistApi';
import StockBadge from '../components/StockBadge';
import PinInput from '../components/ui/PinInput';

function formatDateISO(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function PharmacistPage() {
  const navigate = useNavigate();
  const { qrToken } = useParams();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState(null);

  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [quantities, setQuantities] = useState({});
  const [dispensed, setDispensed] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setPin('');
      setPinError('');
      setDispensed(false);
      setDispenseOpen(false);
      setLightboxUrl(null);
      try {
        const res = await getPharmacistData(qrToken);
        if (cancelled) return;
        setData(res);

        const init = {};
        (res.medicines || []).forEach((m) => {
          const qty = m.refillQuantity ?? m.frequencyPerDay * m.dosePerIntake * 30;
          init[m._id] = Math.round(qty);
        });
        setQuantities(init);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || 'Invalid QR code';
          if (msg === 'Invalid QR code') setNotFound(true);
          else toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  const medicinesSorted = useMemo(() => {
    const meds = data?.medicines || [];
    const order = { red: 0, amber: 1, green: 2 };
    return [...meds].sort((a, b) => {
      const sa = order[a.stockStatus] ?? 3;
      const sb = order[b.stockStatus] ?? 3;
      if (sa !== sb) return sa - sb;
      const da = a.daysLeft ?? 999;
      const db = b.daysLeft ?? 999;
      return da - db;
    });
  }, [data]);

  const patient = data?.patient;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-mint" />
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-[24px] py-[36px]">
        <div className="w-full max-w-[420px] rounded-[16px] border border-border bg-card p-[26px] text-center">
          <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Invalid QR Code. Please scan a valid MedSync QR code.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <div className="bg-navy px-[24px] py-[10px] flex items-center gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <div
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px]"
            style={{ background: 'rgba(0,200,150,0.2)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"
                stroke="#00c896"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="font-display text-[14px] font-bold text-white">MedSync</div>
          <div className="text-[11px] text-white/30 font-body">— Pharmacist View</div>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => navigate('/qr')}
          className="px-[12px] py-[5px] rounded-[7px] border border-[rgba(255,255,255,0.15)] bg-transparent text-[rgba(255,255,255,0.6)] text-[11px] cursor-pointer font-body"
        >
          ← Back to QR
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-[26px] py-[22px] max-w-[980px] mx-auto w-full">
        {/* Patient Header */}
        <div className="bg-navy rounded-[20px] p-[24px_24px] flex items-center justify-between mb-[20px] text-white">
          <div>
            <div className="font-display text-[22px] font-bold mb-[4px] tracking-[-0.4px]">{patient.name}</div>
            <div className="text-[13px] text-white/50 font-body">
              DOB: {formatDateISO(patient.dateOfBirth)} · Scanned: {formatTime(data?.scanTimestamp)}
            </div>
          </div>
          <div
            className="flex items-center gap-[6px] rounded-[99px] border"
            style={{
              background: 'rgba(0,200,150,0.15)',
              borderColor: 'rgba(0,200,150,0.4)',
              color: '#00c896',
              padding: '5px 13px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#00c896' }} />
            Verified
          </div>
        </div>

        {/* Body: 2 columns */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-[16px]">
          {/* Left: Medicine List */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] text-muted uppercase mb-[10px]">MEDICINE LIST</div>
            {(medicinesSorted || []).map((m) => {
              const accent = m.stockStatus === 'red' ? '#e84040' : m.stockStatus === 'amber' ? '#f5a623' : '#27ae60';
              const days = typeof m.daysLeft === 'number' ? m.daysLeft : 0;
              const dayLabel = m.stockStatus === 'green' ? `${days}d left` : days <= 0 ? 'No stock' : `${days}d left`;
              const qtyLabel =
                m.stockStatus === 'green'
                  ? `<strong>${m.currentStock}</strong> tablets remaining`
                  : `Refill needed: <strong>${Math.round(m.refillQuantity ?? m.frequencyPerDay * m.dosePerIntake * 30)}</strong> tablets`;

              return (
                <div
                  key={m._id}
                  className="bg-card border border-border rounded-[20px] p-[16px] mb-[12px] relative overflow-hidden flex items-center gap-[12px]"
                  style={{ background: '#ffffff' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      borderRadius: '4px 0 0 4px',
                      background: accent,
                    }}
                  />

                  <div className="flex-1">
                    <div className="font-display text-[14px] font-bold text-navy">
                      {m.name} <span className="font-normal text-muted text-[11px]">({m.strength}{m.unit})</span>
                    </div>
                    <div className="text-[12px] text-muted mt-[2px]">
                      {m.frequencyPerDay}× daily · 1 tab/dose · {m.instructions || 'After meals'}
                    </div>
                    <div
                      className="text-[12px] text-muted mt-[3px]"
                      dangerouslySetInnerHTML={{ __html: qtyLabel }}
                    />
                  </div>

                  <div className="text-right">
                    <StockBadge status={m.stockStatus} />
                    <div className="text-[10px] text-muted mt-[3px]">{dayLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Prescription & Allergy */}
          <div>
            <div className="bg-card border border-border rounded-[20px] p-[20px] mb-[16px]">
              <div className="font-display text-[14px] font-bold text-navy mb-[2px]">{medicinesSorted[0]?.doctorName || 'Doctor'}</div>
              <div className="text-[12px] text-muted">{medicinesSorted[0]?.hospitalName || ''}</div>

              <div className="mt-[9px] pt-[9px] border-t border-border text-[11px] text-muted">
                <div>
                  Issued: {formatDateISO(medicinesSorted[0]?.prescriptionDate)} · Valid until: {formatDateISO(medicinesSorted[0]?.prescriptionValid)}
                </div>
              </div>

              {medicinesSorted.some((m) => !!m.prescriptionImgUrl) ? (
                <div className="mt-[10px]">
                  {medicinesSorted.map((m) =>
                    m.prescriptionImgUrl ? (
                      <div
                        key={m._id}
                        className="rounded-[10px] overflow-hidden border border-dashed border-border cursor-pointer"
                        onClick={() => setLightboxUrl(m.prescriptionImgUrl)}
                      >
                        <img src={m.prescriptionImgUrl} alt="Prescription" style={{ width: '100%', maxHeight: 140, objectFit: 'cover' }} />
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="mt-[10px] bg-bg rounded-[10px] px-[20px] py-[20px] text-center border border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#e2e8f4', margin: '0 auto' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#e2e8f4" strokeWidth="2" />
                    <path d="M8 12h8" stroke="#e2e8f4" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className="text-[12px] text-muted mt-[7px]">No prescription uploaded</div>
                </div>
              )}
            </div>

            <div className="bg-amber-light border border-[#f5d87a] rounded-[20px] p-[16px_18px] mb-[16px]">
              <div className="text-[10px] font-bold tracking-[0.06em] text-[#9a6200] uppercase mb-[5px]">
                ⚠ Allergies / Notes
              </div>
              <div className="text-[12px] text-[#7a5500] leading-[1.6]">
                {patient.allergies || 'No known allergies recorded.'}
              </div>
            </div>

            <button
              type="button"
              disabled={dispensed}
              className="w-full bg-primary text-white rounded-[20px] px-[12px] py-[14px] font-body text-[14px] font-bold tracking-[0.2px] cursor-pointer flex items-center justify-center gap-[8px] transition-all hover:bg-navy-mid"
              onClick={() => {
                if (dispensed) return;
                setPinError('');
                setDispenseOpen(true);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {dispensed ? '✓ Medicines Dispensed' : 'Confirm & Mark as Dispensed'}
            </button>

            <div className="text-[11px] text-muted text-center mt-[7px]">
              Scanned: {formatTime(data?.scanTimestamp)}
            </div>
          </div>
        </div>
      </div>

      {/* Dispense Modal */}
      {dispenseOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDispenseOpen(false);
          }}
        >
          <div className="bg-card rounded-[20px] p-[32px] w-full max-w-[420px] relative shadow-modal">
            <div
              className="absolute top-[13px] right-[13px] h-[27px] w-[27px] rounded-full bg-bg cursor-pointer flex items-center justify-center border-none"
              onClick={() => setDispenseOpen(false)}
              role="button"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Confirm Dispensing</div>
            <div className="text-[13px] text-muted mb-[18px]">
              Enter the patient's 4-digit pharmacy PIN to confirm medicines were dispensed
            </div>

            <div className="flex flex-col items-center gap-[12px]">
              <PinInput
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setPinError('');
                }}
              />
              {pinError ? <div className="text-[12px] font-semibold text-red text-center">{pinError}</div> : null}
            </div>

            <div className="mt-[16px]">
              <div className="font-body text-[12px] font-semibold text-navy mb-[8px]">Quantities being dispensed</div>
              <div className="space-y-[10px]">
                {medicinesSorted.map((m) => (
                  <div key={m._id} className="flex items-center gap-[11px]">
                    <div className="text-[13px] flex-1 font-body text-navy">{m.name}</div>
                    <input
                      type="number"
                      value={quantities[m._id] ?? ''}
                      onChange={(e) => setQuantities((q) => ({ ...q, [m._id]: e.target.value }))}
                      className="w-[72px] px-[9px] py-[5px] rounded-[7px] border border-border text-[13px] outline-none"
                      min={0}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-[8px] mt-[16px]">
              <button
                type="button"
                className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer"
                onClick={() => setDispenseOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="flex-1 rounded-[20px] bg-primary py-[12px] text-[13px] font-body font-bold text-white cursor-pointer flex items-center justify-center gap-[8px] disabled:opacity-60"
                onClick={async () => {
                  setPinError('');
                  if (!/^\d{4}$/.test(pin)) {
                    setPinError('Incorrect PIN. Please try again.');
                    return;
                  }
                  const items = medicinesSorted
                    .map((m) => ({
                      medicineId: m._id,
                      quantity: Number(quantities[m._id] ?? 0),
                    }))
                    .filter((x) => x.quantity >= 0);
                  setSubmitting(true);
                  try {
                    const res = await dispense(qrToken, { pin, items });
                    if (res?.success) {
                      setDispensed(true);
                      setDispenseOpen(false);
                      toast.success('Medicines dispensed');
                      setData((prev) => ({ ...prev, medicines: res.medicines }));
                    } else {
                      toast.error('Dispense failed');
                    }
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Dispense failed');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Confirm Dispensed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox */}
      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-[20px] gap-[12px] bg-[rgba(0,0,0,0.9)]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLightboxUrl(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={lightboxUrl}
            alt="Prescription"
            style={{ width: '100%', maxWidth: 680, borderRadius: 16, objectFit: 'contain' }}
          />
          <button
            type="button"
            className="px-[24px] py-[12px] bg-[rgba(255,255,255,0.15)] border-none rounded-[12px] font-body text-[14px] font-bold text-white cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

