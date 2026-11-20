import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { requireAuth, requireRole } from '../middleware.js';
import { publicUser } from '../utils.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.enum(['ADMIN', 'PHOTOGRAPHE', 'DECORATEUR', 'CHAUFFEUR'])
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'PHOTOGRAPHE', 'DECORATEUR', 'CHAUFFEUR']).optional(),
  active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni.'
});

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ items: users.map(publicUser) });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Informations utilisateur invalides.',
        details: parsed.error.flatten().fieldErrors
      });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, config.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        role: parsed.data.role
      }
    });

    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Modification invalide.',
        details: parsed.error.flatten().fieldErrors
      });
    }

    if (req.params.id === req.user.id && parsed.data.active === false) {
      return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data
    });

    return res.json({ user: publicUser(updated) });
  } catch (error) {
    return next(error);
  }
});

export default router;
