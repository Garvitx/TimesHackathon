import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@gmail.com';
  const password = 'Admin123';
  const role = 'Admin'; // Works for both String and Role enum

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Admin user with email ${email} already exists.`);
    return;
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin user
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });

  console.log(`Admin user created: ${email}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });