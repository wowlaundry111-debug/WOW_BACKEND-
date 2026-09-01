import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (retries = 5, delayMs = 3000): Promise<void> => {
  if (isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wow_laundry';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting MongoDB connection (attempt ${attempt}/${retries})...`);
      const db = await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        retryWrites: true,
        w: 'majority',
      });
      isConnected = db.connections[0].readyState === 1;

      // Production connection monitoring
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        console.warn('MongoDB disconnected — Mongoose will retry automatically');
      });
      mongoose.connection.on('reconnected', () => {
        isConnected = true;
        console.log('MongoDB reconnected');
      });

      console.log('MongoDB Connected successfully');
      return;
    } catch (error: any) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message || error);
      if (attempt < retries) {
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error('All MongoDB connection attempts failed. Exiting process.');
        process.exit(1);
      }
    }
  }
};

