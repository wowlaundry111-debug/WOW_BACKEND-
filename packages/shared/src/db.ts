import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wow_laundry';
    const db = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 100,       // Allow up to 100 concurrent DB pool connections for high concurrency
      minPoolSize: 10,        // Keep 10 warm connections ready
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
    });
    isConnected = db.connections[0].readyState === 1;

    // Production connection monitoring
    mongoose.connection.on('error', (err) => {
      process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'MongoDB connection error', error: err.message }) + '\n');
    });
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', msg: 'MongoDB disconnected — Mongoose will retry automatically' }) + '\n');
    });
    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level: 'info', msg: 'MongoDB reconnected' }) + '\n');
    });

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

