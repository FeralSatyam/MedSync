export function getStockStatus(medicine) {
  const { currentStock, frequencyPerDay, dosePerIntake, refillThreshold } = medicine;
  const dailyUsage = frequencyPerDay * dosePerIntake;
  if (dailyUsage === 0) return { status: 'green', daysLeft: Infinity };

  const daysLeft = Math.floor(currentStock / dailyUsage);

  if (daysLeft <= 3) return { status: 'red', daysLeft };
  if (daysLeft <= refillThreshold) return { status: 'yellow', daysLeft };
  return { status: 'green', daysLeft };
}

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

export function sortMedicinesByUrgency(medicines, statusFn = getStockStatus) {
  const order = { red: 0, yellow: 1, green: 2 };
  return [...medicines].sort((a, b) => {
    const sa = order[statusFn(a).status] ?? 3;
    const sb = order[statusFn(b).status] ?? 3;
    if (sa !== sb) return sa - sb;
    return (statusFn(a).daysLeft ?? 999) - (statusFn(b).daysLeft ?? 999);
  });
}
