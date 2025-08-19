import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../models/database';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Create admin (Super Admin only)
router.post('/', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { username, displayName, password } = req.body;

    if (!username || !displayName || !password) {
      throw createError('Username, displayName, and password are required', 400);
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw createError('Username already exists', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        username,
        displayName,
        role: 'ADMIN',
        passwordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ admin });
  } catch (error) {
    next(error);
  }
});

// List admins (Super Admin only)
router.get('/', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res, next) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        username: true,
        displayName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ admins });
  } catch (error) {
    next(error);
  }
});

// Delete admin (Super Admin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const admin = await prisma.user.findUnique({
      where: { id },
    });

    if (!admin) {
      throw createError('Admin not found', 404);
    }

    if (admin.role !== 'ADMIN') {
      throw createError('User is not an admin', 400);
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get system settings
router.get('/settings', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res, next) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          schoolName: process.env.SCHOOL_NAME || 'AI School Assistant',
          themeDefault: process.env.THEME || 'dark',
          retentionMonths: parseInt(process.env.DATA_RETENTION_MONTHS || '12'),
        },
      });
    }

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Update system settings
router.put('/settings', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { schoolName, themeDefault, retentionMonths } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          schoolName: schoolName || process.env.SCHOOL_NAME || 'AI School Assistant',
          themeDefault: themeDefault || process.env.THEME || 'dark',
          retentionMonths: retentionMonths || parseInt(process.env.DATA_RETENTION_MONTHS || '12'),
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          schoolName: schoolName || settings.schoolName,
          themeDefault: themeDefault || settings.themeDefault,
          retentionMonths: retentionMonths || settings.retentionMonths,
        },
      });
    }

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

export default router;
