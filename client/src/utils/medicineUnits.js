// Maps a medicine's dosage form to the medically appropriate stock unit so that
// remaining stock reads in real units (mL of syrup, puffs of an inhaler, vials of
// an injection, …) instead of always counting "tablets".
//
// The medicine's own `stockUnit` (chosen when it was added) is preferred when
// present; the form-based defaults below are the fallback for older records.
const DEFAULT_UNIT_BY_FORM = {
  tablets: 'tablets',
  syrup: 'mL',
  cream: 'g',
  inhaler: 'puffs',
  injection: 'vials',
  powder: 'g',
};

// Count nouns we can sensibly singularise when exactly one unit remains.
// Volume/mass units (mL, L, g, mg) are intentionally left untouched.
const SINGULARS = {
  tablets: 'tablet',
  capsules: 'capsule',
  puffs: 'puff',
  vials: 'vial',
  doses: 'dose',
  sachets: 'sachet',
  days: 'day',
  weeks: 'week',
};

// Returns the unit label for a medicine, singularised when the count is exactly 1.
export function stockUnitLabel(medicine = {}, count) {
  const unit =
    (medicine.stockUnit && String(medicine.stockUnit).trim()) ||
    DEFAULT_UNIT_BY_FORM[medicine.medicineForm] ||
    'tablets';

  if (Number(count) === 1 && SINGULARS[unit]) return SINGULARS[unit];
  return unit;
}

// Returns a display string such as "100 mL", "1 tablet" or "200 puffs".
export function formatStock(medicine = {}, count = medicine.currentStock) {
  const value = count ?? 0;
  return `${value} ${stockUnitLabel(medicine, value)}`;
}
