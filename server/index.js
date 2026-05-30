import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS configuration - Simplified version without '*'
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pharmacistRoutes from './routes/pharmacistRoutes.js';
import pharmacistInvitationRoutes from './routes/pharmacistInvitationRoutes.js';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'MedSync API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MedSync API is running',
    status: 'active',
    endpoints: ['/api/auth', '/api/patients', '/api/medicines', '/api/orders', '/api/pharmacist', '/api/health']
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pharmacist', pharmacistRoutes);
app.use('/api/pharmacist-invitations', pharmacistInvitationRoutes);

// 404 handler - Use function, not '*'
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.log('Starting server without database for testing...');
  app.listen(PORT, () => {
    console.log(`🚀 MedSync server running on port ${PORT} (without database)`);
  });
} else {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      app.listen(PORT, () => {
        console.log(`🚀 MedSync server running on port ${PORT}`);
        console.log(`📍 API available at http://localhost:${PORT}/api`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      console.log('Starting server without database...');
      app.listen(PORT, () => {
        console.log(`🚀 MedSync server running on port ${PORT} (without database)`);
      });
    });
}

export default app;