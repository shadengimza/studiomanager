import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { prisma } from './db.js';

export async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  try {
    const payload = jwt.verify(match[1], config.JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!payload.sub) {
      return res.status(401).json({ error: 'Jeton invalide.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true
      }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Compte inexistant ou désactivé.' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Vous ne disposez pas des droits nécessaires.' });
    }
    return next();
  };
}
