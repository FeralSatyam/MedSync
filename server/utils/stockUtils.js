// Stock status helpers (shared by dashboard + pharmacist view).
// Must mirror the prompt spec exactly.

export function getStockStatus(medicine) {
  const dailyUsage = medicine.frequencyPerDay * medicine.dosePerIntake;
  if (!dailyUsage) return { status: 'green', daysLeft: 999 };

  const daysLeft = Math.floor(medicine.currentStock / dailyUsage);
  if (daysLeft <= 3) return { status: 'red', daysLeft };
  if (daysLeft <= (medicine.refillThreshold || 7)) return { status: 'amber', daysLeft };
  return { status: 'green', daysLeft };
}

export function getRefillQuantity(medicine, supplyDays = 30) {
  return medicine.frequencyPerDay * medicine.dosePerIntake * supplyDays;
}

