// import dns from 'node:dns';
// // Or use: const dns = require('node:dns');

// dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google Public DNS

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import pharmacistRoutes from './routes/pharmacistRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

connectDB();

import './jobs/stockCron.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      // Dev convenience: allow any localhost port to avoid CORS issues.
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, origin);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/pharmacist', pharmacistRoutes);

app.use(errorMiddleware);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`MedSync server running on port ${port}`);
});
