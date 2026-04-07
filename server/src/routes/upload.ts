import { Router } from 'express';
import { supabase } from '../supabase.js';
import { adminAuth } from '../middleware.js';

export const uploadRouter = Router();

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
