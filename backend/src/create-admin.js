import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { config } from './config.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST, ADMIN_LAST } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_FIRST || !ADMIN_LAST) {
  throw new Error('Variables ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST et ADMIN_LAST obligatoires.');
}
if (ADMIN_PASSWORD.length < 12) {
  throw new Error('Le mot de passe initial doit contenir au moins 12 caractères.');
}

try {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, config.BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: ADMIN_FIRST.trim(),
      lastName: ADMIN_LAST.trim(),
      role: 'ADMIN'
    }
  });

  console.log(`Administrateur prêt : ${admin.email}`);
} finally {
  await prisma.$disconnect();
}
