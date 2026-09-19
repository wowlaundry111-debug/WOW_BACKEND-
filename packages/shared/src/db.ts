import mongoose from 'mongoose';
import { log } from './logger';

let isConnected = false;

export const connectDB = async (retries = 5, delayMs = 3000): Promise<void> => {
  if (isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wow_laundry';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log.info(`Attempting MongoDB connection (attempt ${attempt}/${retries})`);
      const db = await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 200,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        retryWrites: true,
        w: 'majority',
      });
      isConnected = db.connections[0].readyState === 1;

      // Drop legacy unique index on phone if present so branch staff can share contact numbers
      try {
        await mongoose.connection.collection('users').dropIndex('phone_1');
        log.info('Dropped legacy unique index phone_1 on users');
      } catch (dropErr: any) {
        // Ignored if index doesn't exist (code 27)
      }

      // Production connection monitoring
      mongoose.connection.on('error', (err) => {
        log.error('MongoDB connection error', { error: err.message });
      });
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        log.warn('MongoDB disconnected — Mongoose will retry automatically');
      });
      mongoose.connection.on('reconnected', () => {
        isConnected = true;
        log.info('MongoDB reconnected');
      });

      log.info('MongoDB connected successfully');
      return;
    } catch (error: any) {
      log.error(`MongoDB connection attempt ${attempt} failed`, { error: error.message || error });
      if (attempt < retries) {
        log.info(`Retrying in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        log.error('All MongoDB connection attempts failed. Exiting process.');
        process.exit(1);
      }
    }
  }
};

