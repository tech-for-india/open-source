import { Router } from 'express';
import { prisma } from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Get usage reports
router.get('/usage', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { 
      class: class_, 
      userId, 
      startDate, 
      endDate,
      groupBy = 'user' // user, class, date
    } = req.query;

    const where: any = {};
    
    if (class_) where.user = { class: class_ };
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (groupBy === 'user') {
      const usage = await prisma.message.groupBy({
        by: ['userId'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
        },
      });

      const userDetails = await prisma.user.findMany({
        where: { id: { in: usage.map(u => u.userId) } },
        select: { id: true, username: true, displayName: true, class: true, role: true },
      });

      const result = usage.map(u => {
        const user = userDetails.find(ud => ud.id === u.userId);
        return {
          userId: u.userId,
          username: user?.username,
          displayName: user?.displayName,
          class: user?.class,
          role: user?.role,
          messageCount: u._count.id,
          promptTokens: u._sum.promptTokens || 0,
          completionTokens: u._sum.completionTokens || 0,
          totalTokens: u._sum.totalTokens || 0,
        };
      });

      res.json({ usage: result, groupBy: 'user' });
    } else if (groupBy === 'class') {
      const usage = await prisma.message.groupBy({
        by: ['userId'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
        },
      });

      const userDetails = await prisma.user.findMany({
        where: { id: { in: usage.map(u => u.userId) } },
        select: { id: true, class: true },
      });

      const classUsage: any = {};
      
      usage.forEach(u => {
        const user = userDetails.find(ud => ud.id === u.userId);
        const className = user?.class || 'Unknown';
        
        if (!classUsage[className]) {
          classUsage[className] = {
            class: className,
            messageCount: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            userCount: 0,
          };
        }
        
        classUsage[className].messageCount += u._count.id;
        classUsage[className].promptTokens += u._sum.promptTokens || 0;
        classUsage[className].completionTokens += u._sum.completionTokens || 0;
        classUsage[className].totalTokens += u._sum.totalTokens || 0;
        classUsage[className].userCount += 1;
      });

      res.json({ usage: Object.values(classUsage), groupBy: 'class' });
    } else if (groupBy === 'date') {
      const usage = await prisma.message.groupBy({
        by: ['createdAt'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
        },
      });

      const result = usage.map(u => ({
        date: u.createdAt.toISOString().split('T')[0],
        messageCount: u._count.id,
        promptTokens: u._sum.promptTokens || 0,
        completionTokens: u._sum.completionTokens || 0,
        totalTokens: u._sum.totalTokens || 0,
      }));

      res.json({ usage: result, groupBy: 'date' });
    } else {
      throw createError('Invalid groupBy parameter', 400);
    }
  } catch (error) {
    next(error);
  }
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [
      totalUsers,
      totalChats,
      totalMessages,
      totalTokens,
      activeUsersToday,
      activeUsersThisWeek,
      activeUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.message.aggregate({
        _sum: { totalTokens: true },
      }),
      prisma.user.count({
        where: {
          chats: {
            some: {
              updatedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          chats: {
            some: {
              updatedAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - 7)),
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          chats: {
            some: {
              updatedAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalChats,
        totalMessages,
        totalTokens: totalTokens._sum.totalTokens || 0,
        activeUsersToday,
        activeUsersThisWeek,
        activeUsersThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
