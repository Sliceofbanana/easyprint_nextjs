import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password (using 'password123' for all test users)
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@easyprint.com' },
    update: {},
    create: {
      email: 'admin@easyprint.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Staff User
  const staff = await prisma.user.upsert({
    where: { email: 'staff@easyprint.com' },
    update: {},
    create: {
      email: 'staff@easyprint.com',
      name: 'Staff Member',
      password: hashedPassword,
      role: 'STAFF',
      emailVerified: true,
    },
  });
  console.log('✅ Staff user created:', staff.email);

  // Create Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@easyprint.com' },
    update: {},
    create: {
      email: 'user@easyprint.com',
      name: 'Regular User',
      password: hashedPassword,
      role: 'USER',
      emailVerified: true,
    },
  });
  console.log('✅ Regular user created:', user.email);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });