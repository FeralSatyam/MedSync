import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const notifs = await Notification.find({});
    console.log(`Found ${notifs.length} notifications in the DB.`);
    if (notifs.length > 0) {
      console.log('Sample Notification:', notifs[0]);
    } else {
      console.log('No notifications found in the database. The sync might not be working.');
      
      const Offer = (await import('./models/Offer.js')).default;
      const offers = await Offer.find({});
      console.log(`Found ${offers.length} offers in the DB.`);
      if (offers.length > 0) {
        console.log('Sample Offer:', offers[0]);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
