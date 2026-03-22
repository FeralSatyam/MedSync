import cron from 'node-cron';
import Medicine from '../models/Medicine.js';

// 23:59 Nepal Standard Time (UTC+5:45) → 18:14 UTC
cron.schedule(
  '14 18 * * *',
  async () => {
    console.log('[CRON] Running daily stock reduction...');
    try {
      const medicines = await Medicine.find({ isActive: true });
      const bulkOps = medicines.map((med) => {
        const dailyUsage = med.frequencyPerDay * med.dosePerIntake;
        const newStock = Math.max(0, med.currentStock - dailyUsage);
        return {
          updateOne: {
            filter: { _id: med._id },
            update: { $set: { currentStock: newStock, lastReducedAt: new Date() } },
          },
        };
      });
      if (bulkOps.length) {
        await Medicine.bulkWrite(bulkOps);
      }
      console.log(`[CRON] Stock reduced for ${medicines.length} medicines.`);
    } catch (err) {
      console.error('[CRON] Error during stock reduction:', err);
    }
  },
  { timezone: 'UTC' }
);
