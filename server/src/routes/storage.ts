import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload avatar
router.post('/upload/avatar', authenticateToken, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = `/uploads/avatars/${req.file.filename}`;
    
    // Determine protocol - check X-Forwarded-Proto header (from proxy) or use environment variable
    const protocol = req.get('X-Forwarded-Proto') || 
                     (process.env.NODE_ENV === 'production' ? 'https' : req.protocol);
    
    // Use environment variable for base URL if available, otherwise construct from request
    const baseUrl = process.env.BACKEND_URL || `${protocol}://${req.get('host')}`;
    const fullUrl = `${baseUrl}${filePath}`;

    res.json({
      url: fullUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

