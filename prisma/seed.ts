import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: UserRole.ADMIN, name: 'Admin' },
    create: { email, passwordHash, role: UserRole.ADMIN, name: 'Admin' }
  });

  const reviewerEmail = 'reviewer@agency.local';
  await prisma.user.upsert({
    where: { email: reviewerEmail },
    update: { passwordHash, role: UserRole.REVIEWER, name: 'Reviewer' },
    create: { email: reviewerEmail, passwordHash, role: UserRole.REVIEWER, name: 'Reviewer' }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
