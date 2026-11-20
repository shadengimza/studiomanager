import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware.js';
import { publicUser } from '../utils.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Données de connexion invalides.',
        details: parsed.error.flatten().fieldErrors
      });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    const passwordIsValid = user
      ? await bcrypt.compare(parsed.data.password, user.passwordHash)
      : false;

    if (!user || !user.active || !passwordIsValid) {
      return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
    }

    const accessToken = jwt.sign(
      { role: user.role },
      config.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: config.JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    return res.status(200).json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: config.JWT_EXPIRES_IN,
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

router.post('/logout', requireAuth, (_req, res) => {
  return res.status(200).json({ message: 'Déconnexion effectuée. Supprimez le jeton côté client.' });
});

export default router;
