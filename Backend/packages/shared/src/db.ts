import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wow_laundry';
    const db = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,        // Allow up to 50 concurrent connections (was default 5)
      minPoolSize: 5,          // Keep 5 warm to avoid cold-connection latency
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
