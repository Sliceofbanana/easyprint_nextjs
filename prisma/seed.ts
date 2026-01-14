import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ✅ Create Admin - Changed from prisma.user to prisma.users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@easyprint.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // ✅ Create Staff - Changed from prisma.user to prisma.users
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.create({
    data: {
      name: 'Staff Member',
      email: 'staff@easyprint.com',
      password: staffPassword,
      role: 'STAFF',
    },
  });
  console.log('✅ Created Staff:', staff.email);

  // ✅ Create Customer - Changed from prisma.user to prisma.users
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'customer@easyprint.com',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Created Customer:', customer.email);

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