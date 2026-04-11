import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';
import multer from 'multer';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

export const uploadRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 * 1024 } }); // 5GB max

// Upload File directly to Bunny Storage
uploadRouter.post('/file', adminAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl topilmadi' });
  const { originalname, buffer } = req.file;
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;
  const storageHost = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';

  if (!zone || !apiKey) return res.status(500).json({ error: 'Bunny konfiguratsiyasi topilmadi' });

  const safeName = `${Date.now()}_${originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const url = `https://${storageHost}/${zone}/${safeName}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer
    });

    if (!response.ok) {
      const txt = await response.text();
      return res.status(500).json({ error: `Bunny.net Xatosi: ${txt}` });
    }

    res.json({ url: `${pullZoneUrl?.replace(/\/$/, '')}/${safeName}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Video directly to Bunny Stream
uploadRouter.post('/video', adminAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl topilmadi' });
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const pullZone = process.env.BUNNY_STREAM_HOST || 'iframe.mediadelivery.net'; // or vz-xxx.b-cdn.net

  if (!libraryId || !apiKey) return res.status(500).json({ error: 'Bunny Stream konfiguratsiyasi topilmadi' });

  try {
    const createReq = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: req.file.originalname })
    });
    
    if (!createReq.ok) return res.status(500).json({ error: 'Bunny Stream Video yaratishda xato' });
    const createRes = await createReq.json() as any;
    const videoId = createRes.guid;

    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: req.file.buffer
    });

    if (!uploadRes.ok) return res.status(500).json({ error: 'Video yuklashda xato' });

    let finalUrl = `https://${pullZone}/${videoId}/playlist.m3u8`;
    if (pullZone.includes('iframe.mediadelivery.net')) {
        finalUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`;
    }

    res.json({ url: finalUrl, iframe: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload to Supabase Storage
uploadRouter.post('/image', adminAuth, async (req, res) => {
  const { base64, filename, bucket } = req.body;
  const bucketName = bucket || 'images';
  const filePath = `${Date.now()}_${filename}`;
  
  const buffer = Buffer.from(base64, 'base64');
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, { contentType: 'image/webp', upsert: true });
  
  if (error) return res.status(500).json({ error: error.message });
  
  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  res.json({ url: urlData.publicUrl, path: data.path });
});

// Delete from storage
uploadRouter.delete('/image', adminAuth, async (req, res) => {
  const { path, bucket } = req.body;
  await supabase.storage.from(bucket || 'images').remove([path]);
  res.json({ success: true });
});
