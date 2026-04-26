import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../validation/schemas.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

// In production, store hashed password in env; here we support a simple hash check
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

function generateTokens(payload: { id: string; email: string }) {
  const accessToken = jwt.sign({ ...payload, role: 'admin' }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ ...payload, role: 'admin' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
    return;
  }

  const { email, password } = parse.data;

  if (email !== ADMIN_EMAIL) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  let valid = false;
  if (ADMIN_PASSWORD_HASH) {
    valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    // Dev fallback — plain text comparison when no hash configured
    valid = password === 'admin123';
  }

  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokens = generateTokens({ id: 'admin', email });
  res.json({
    user: { id: 'admin', email },
    ...tokens,
  });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; email: string };
    const tokens = generateTokens({ id: payload.id, email: payload.email });
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
