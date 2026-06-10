import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, (req, res, next) => {
  res.status(201).json({ success: true, message: 'Not implemented' });
});

router.post('/login', authLimiter, (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
});

router.post('/logout', authenticate, (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
});

router.post('/refresh', (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
});

router.post('/forgot-password', authLimiter, (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
});

router.post('/reset-password', authLimiter, (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
});

router.get('/me', authenticate, (req, res, next) => {
  res.status(200).json({ success: true, data: req.user });
});

router.get('/clerk', (req, res, next) => {
  res.status(200).json({ success: true, message: 'Clerk webhook endpoint' });
});

export default router;
