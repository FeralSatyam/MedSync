import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient, updateMedicine } from '../api/medicineApi';

// Web Audio API — loud high-frequency siren alarm
let audioCtx = null;
let beepInterval = null;
let sirenToggle = false;

function startBeeping() {
  if (beepInterval) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch((e) => console.log('Could not resume audio:', e));
  }

  // Fire a rapid alternating dual-tone siren burst every 200ms
  beepInterval = setInterval(() => {
    try {
      const t = audioCtx.currentTime;
      // Alternate between two high-pitched frequencies for a siren effect
      const freq = sirenToggle ? 1500 : 1800;
      sirenToggle = !sirenToggle;

      // Primary oscillator — square wave for harsh, piercing tone
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(1.0, t + 0.01);   // instant attack
      gain.gain.setValueAtTime(1.0, t + 0.12);             // sustain
      gain.gain.linearRampToValueAtTime(0.001, t + 0.18);  // quick decay
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.19);

      // Harmonic overtone for extra urgency
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.5, t);        // 1.5× harmonic
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.5, t + 0.01);
      gain2.gain.setValueAtTime(0.5, t + 0.12);
      gain2.gain.linearRampToValueAtTime(0.001, t + 0.18);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(t);
      osc2.stop(t + 0.19);
    } catch (e) {
      console.error('Audio alarm error', e);
    }
  }, 200); // rapid 200ms interval for urgency
}

function stopBeeping() {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
  sirenToggle = false;
}

// Helper to calculate times of day for a medicine
function getScheduledTimes(firstDoseTime, frequencyPerDay) {
  if (!firstDoseTime) return [];
  const parts = firstDoseTime.split(':');
  if (parts.length < 2) return [];
  const startHour = parseInt(parts[0], 10);
  const startMin = parseInt(parts[1], 10);
  if (isNaN(startHour) || isNaN(startMin)) return [];

  const times = [];
  const intervalHours = 24 / frequencyPerDay;
  for (let i = 0; i < frequencyPerDay; i++) {
    const totalMinutes = Math.round((startHour * 60 + startMin) + i * intervalHours * 60);
    const h = Math.floor((totalMinutes / 60) % 24);
    const m = Math.floor(totalMinutes % 60);
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    times.push(formatted);
  }
  return times;
}

export default function AlarmManager() {
  const token = useAuthStore((s) => s.token);
  const refreshTrigger = useAppStore((s) => s.refreshTrigger);
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);

  const [trackedMedicines, setTrackedMedicines] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [snoozeTimeMap, setSnoozeTimeMap] = useState({});
  const lastTriggeredRef = useRef({}); // Tracks { medicineId: 'YYYY-MM-DD HH:MM' }

  // Load all medicines for patients of the logged in user
  const loadAllMedicines = async () => {
    if (!token) return;
    try {
      const patientsList = await getPatients();
      const allMeds = [];
      for (const p of patientsList) {
        const meds = await getMedicinesForPatient(p._id || p.id);
        for (const m of meds) {
          if (m.isActive && m.remindersEnabled) {
            allMeds.push({
              ...m,
              patientName: p.name,
            });
          }
        }
      }
      setTrackedMedicines(allMeds);
    } catch (err) {
      console.error('AlarmManager failed to fetch medicines:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllMedicines();
    } else {
      setTrackedMedicines([]);
      setActiveAlarms([]);
      stopBeeping();
    }
  }, [token, refreshTrigger]);

  // Periodic polling for sync
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(loadAllMedicines, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Check alarm time loop
  useEffect(() => {
    if (!token || trackedMedicines.length === 0) return;

    const checkTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      
      const timeStr = `${hour}:${min}`;
      const minuteKey = `${year}-${month}-${date} ${timeStr}`;
      const nowMs = Date.now();

      const newAlarms = [];

      trackedMedicines.forEach((med) => {
        // 1. Regular schedule check
        const scheds = getScheduledTimes(med.firstDoseTime, med.frequencyPerDay);
        if (scheds.includes(timeStr)) {
          // If not already triggered for this specific minute
          if (lastTriggeredRef.current[med._id] !== minuteKey) {
            // Also ensure it is not already in active alarms
            if (!activeAlarms.some((a) => a._id === med._id) && !newAlarms.some((a) => a._id === med._id)) {
              newAlarms.push(med);
              lastTriggeredRef.current[med._id] = minuteKey;
            }
          }
        }

        // 2. Snooze timeout check
        if (snoozeTimeMap[med._id] && nowMs >= snoozeTimeMap[med._id]) {
          if (!activeAlarms.some((a) => a._id === med._id) && !newAlarms.some((a) => a._id === med._id)) {
            newAlarms.push(med);
            // Clear snooze timer since it's firing now
            setSnoozeTimeMap((prev) => {
              const updated = { ...prev };
              delete updated[med._id];
              return updated;
            });
          }
        }
      });

      if (newAlarms.length > 0) {
        setActiveAlarms((prev) => {
          const combined = [...prev];
          newAlarms.forEach((na) => {
            if (!combined.some((x) => x._id === na._id)) {
              combined.push(na);
            }
          });
          return combined;
        });
      }
    };

    // Run check every 3 seconds to be highly responsive but low CPU
    const checkInterval = setInterval(checkTime, 3000);
    return () => clearInterval(checkInterval);
  }, [token, trackedMedicines, activeAlarms, snoozeTimeMap]);

  // Handle beep sound based on activeAlarms list
  useEffect(() => {
    if (activeAlarms.length > 0) {
      startBeeping();
    } else {
      stopBeeping();
    }
    return () => stopBeeping();
  }, [activeAlarms]);

  // Actions
  const handleTaken = async (med) => {
    const nextStock = Math.max(0, med.currentStock - med.dosePerIntake);
    try {
      await updateMedicine(med._id, { currentStock: nextStock });
      toast.success(`Dose logged for ${med.name}! Stock is now ${nextStock}.`);
      triggerRefresh();
      // Remove from active alarms
      setActiveAlarms((prev) => prev.filter((x) => x._id !== med._id));
    } catch (err) {
      console.error('Failed to log taken dose:', err);
      toast.error('Failed to update medicine stock.');
    }
  };

  const handleSnooze = (med) => {
    const snoozeDuration = 5 * 60 * 1000; // 5 minutes
    setSnoozeTimeMap((prev) => ({
      ...prev,
      [med._id]: Date.now() + snoozeDuration,
    }));
    toast.success(`Snoozed ${med.name} for 5 minutes.`);
    // Remove from active alarms
    setActiveAlarms((prev) => prev.filter((x) => x._id !== med._id));
  };

  if (activeAlarms.length === 0) return null;

  // Render the top alarm in the queue
  const currentAlarm = activeAlarms[0];

  return (
    <div className="fixed inset-0 bg-[#0f172a]/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-150 relative overflow-hidden flex flex-col items-center text-center animate-scale-up">
        {/* Ringing Visual pulses */}
        <div className="absolute inset-0 bg-teal-50/10 pointer-events-none animate-pulse" />
        
        {/* Glowing Alarm Pulse Outer */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-teal-400 rounded-full opacity-20 animate-ping" />
          <div className="absolute inset-2 bg-teal-500 rounded-full opacity-35 animate-pulse" />
          <div className="relative w-24 h-24 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center overflow-hidden z-10">
            {currentAlarm.medicinePhotoUrl ? (
              <img
                src={currentAlarm.medicinePhotoUrl}
                alt={currentAlarm.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Patient Label */}
        <div className="inline-block px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          ⏰ Medication Alert
        </div>

        {/* Patient Name */}
        <div className="text-gray-500 text-xs font-medium mb-1">
          Reminder for <span className="text-teal-600 font-bold">{currentAlarm.patientName}</span>
        </div>

        {/* Medicine Name & Strength */}
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight leading-tight mb-2">
          {currentAlarm.name}
        </h2>
        
        {/* Strength & Instruction */}
        <div className="bg-gray-50 rounded-2xl p-4 w-full mb-6 border border-gray-100">
          <div className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-1">Dosage Required</div>
          <div className="text-gray-800 text-lg font-bold">
            {currentAlarm.dosePerIntake} Pill{currentAlarm.dosePerIntake > 1 ? 's' : ''} ({currentAlarm.strength}{currentAlarm.unit})
          </div>
          {currentAlarm.instructions && (
            <div className="text-gray-500 text-xs mt-2 italic">
              "{currentAlarm.instructions}"
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => handleTaken(currentAlarm)}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3.5 px-6 rounded-2xl text-base font-bold shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            I have Taken this
          </button>
          
          <button
            onClick={() => handleSnooze(currentAlarm)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-6 rounded-2xl text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Snooze (5 mins)
          </button>
        </div>
      </div>
    </div>
  );
}
