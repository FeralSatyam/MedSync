import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    console.error(
      'MongoDB connection error: MONGODB_URI is missing or empty.\n' +
        'Create server/.env (copy from server/.env.example) and set:\n' +
        '  MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<dbname>'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri.trim());
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
