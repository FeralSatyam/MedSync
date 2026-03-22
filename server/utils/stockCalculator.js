/** Patient dashboard: uses refillThreshold for yellow band. */
export function getStockStatus(medicine) {
  const { currentStock, frequencyPerDay, dosePerIntake, refillThreshold } = medicine;
  const dailyUsage = frequencyPerDay * dosePerIntake;
  if (dailyUsage === 0) return { status: 'green', daysLeft: Infinity };

  const daysLeft = Math.floor(currentStock / dailyUsage);

  if (daysLeft <= 3) return { status: 'red', daysLeft };
  if (daysLeft <= refillThreshold) return { status: 'yellow', daysLeft };
  return { status: 'green', daysLeft };
}

/** Pharmacist view: Red 0–3, Yellow 4–7, Green 8+ days. */
export function getPharmacistStockStatus(medicine) {
  const { currentStock, frequencyPerDay, dosePerIntake } = medicine;
  const dailyUsage = frequencyPerDay * dosePerIntake;
  if (dailyUsage === 0) return { status: 'green', daysLeft: Infinity };

  const daysLeft = Math.floor(currentStock / dailyUsage);

  if (daysLeft <= 3) return { status: 'red', daysLeft };
  if (daysLeft <= 7) return { status: 'yellow', daysLeft };
  return { status: 'green', daysLeft };
}

export function getRefillQuantity(medicine, supplyDays = 30) {
  return Math.ceil(medicine.frequencyPerDay * medicine.dosePerIntake * supplyDays);
}
