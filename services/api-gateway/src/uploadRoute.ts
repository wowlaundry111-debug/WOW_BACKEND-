import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { log } from '@wow/shared';

const router = Router();

// Ensure Cloudinary uses the URL from .env explicitly
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL.trim(),
    secure: true,
  });
}

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Upload to Cloudinary directly from memory buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'wow_laundry' },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    res.json({ url: (result as any)?.secure_url });
  } catch (error: any) {
    log.error('Cloudinary upload error', { error: error?.message || error });
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
