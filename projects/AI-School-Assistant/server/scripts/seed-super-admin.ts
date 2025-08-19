import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  try {
    const username = process.env.SUPERADMIN_USERNAME || 'admin';
    const password = process.env.SUPERADMIN_PASSWORD || 'admin123';

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create super admin
    const superAdmin = await prisma.user.create({
      data: {
        username,
        displayName: 'Super Administrator',
        role: 'SUPERADMIN',
        passwordHash,
        mustChangePassword: false,
      },
    });

    console.log('✅ Super admin created successfully');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin();
