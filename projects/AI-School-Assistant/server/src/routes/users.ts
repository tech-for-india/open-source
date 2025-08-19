import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Generate username from class and roll
function generateUsername(class_: string, roll: string): string {
  return `${class_.toLowerCase().replace(/\s+/g, '')}${roll}`.replace(/[^a-z0-9]/g, '');
}

// Generate default password
function generateDefaultPassword(dob: string, fatherName?: string, motherName?: string, classTeacherName?: string): string {
  const dobPart = dob.replace(/-/g, '');
  const namePart = fatherName || motherName || classTeacherName || 'default';
  return `${dobPart}${namePart.toLowerCase().replace(/\s+/g, '')}`.substring(0, 12);
}

// Create single user
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { username, displayName, role, class: class_, roll, dob, fatherName, motherName, classTeacherName } = req.body;

    if (!username || !displayName || !role) {
      throw createError('Username, displayName, and role are required', 400);
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw createError('Username already exists', 400);
    }

    // Generate default password
    const defaultPassword = generateDefaultPassword(dob, fatherName, motherName, classTeacherName);
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        role,
        class: class_,
        roll,
        dob: dob ? new Date(dob) : null,
        fatherName,
        motherName,
        classTeacherName,
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        class: true,
        roll: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      user,
      defaultPassword,
      message: 'User created successfully. Default password provided.',
    });
  } catch (error) {
    next(error);
  }
});

// Batch create users from CSV
router.post('/batch', authenticateToken, requireAdmin, upload.single('csv'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw createError('CSV file is required', 400);
    }

    const results: any[] = [];
    const errors: any[] = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const createdUsers: any[] = [];

        for (const row of results) {
          try {
            const { class: class_, roll, dob, fatherName, motherName, classTeacherName, displayName } = row;

            if (!class_ || !roll || !dob || !displayName) {
              errors.push({
                row,
                error: 'Missing required fields: class, roll, dob, displayName',
              });
              continue;
            }

            const username = generateUsername(class_, roll);
            const defaultPassword = generateDefaultPassword(dob, fatherName, motherName, classTeacherName);

            // Check if username already exists
            const existingUser = await prisma.user.findUnique({
              where: { username },
            });

            if (existingUser) {
              errors.push({
                row,
                error: `Username ${username} already exists`,
              });
              continue;
            }

            const passwordHash = await bcrypt.hash(defaultPassword, 12);

            const user = await prisma.user.create({
              data: {
                username,
                displayName,
                role: 'USER',
                class: class_,
                roll,
                dob: new Date(dob),
                fatherName,
                motherName,
                classTeacherName,
                passwordHash,
                mustChangePassword: true,
              },
              select: {
                id: true,
                username: true,
                displayName: true,
                class: true,
                roll: true,
                createdAt: true,
              },
            });

            createdUsers.push({
              ...user,
              defaultPassword,
            });
          } catch (error) {
            errors.push({
              row,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          created: createdUsers.length,
          errors: errors.length,
          users: createdUsers,
          errorDetails: errors,
        });
      });
  } catch (error) {
    next(error);
  }
});

// List users
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { role, class: class_, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (role) where.role = role;
    if (class_) where.class = class_;

    // For superadmin, include password information
    const isSuperAdmin = req.user!.role === 'SUPERADMIN';
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        class: true,
        roll: true,
        createdAt: true,
        mustChangePassword: true,
        dob: isSuperAdmin,
        fatherName: isSuperAdmin,
        motherName: isSuperAdmin,
        classTeacherName: isSuperAdmin,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    // Generate passwords for superadmin
    if (isSuperAdmin) {
      const usersWithPasswords = users.map(user => ({
        ...user,
        defaultPassword: generateDefaultPassword(
          user.dob?.toISOString().split('T')[0] || '',
          user.fatherName,
          user.motherName,
          user.classTeacherName
        ),
      }));
      
      res.json({
        users: usersWithPasswords,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: await prisma.user.count({ where }),
          pages: Math.ceil(await prisma.user.count({ where }) / Number(limit)),
        },
      });
    } else {
      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: await prisma.user.count({ where }),
          pages: Math.ceil(await prisma.user.count({ where }) / Number(limit)),
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Prevent deleting super admin
    if (user.role === 'SUPERADMIN') {
      throw createError('Cannot delete super admin', 403);
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Reset user password
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const defaultPassword = generateDefaultPassword(
      user.dob?.toISOString().split('T')[0] || '',
      user.fatherName,
      user.motherName,
      user.classTeacherName
    );

    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    res.json({
      message: 'Password reset successfully',
      defaultPassword,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
