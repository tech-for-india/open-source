import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function purgeAnnualData() {
  try {
    console.log('🗑️  Starting annual data purge...');

    // Get retention months from settings or environment
    const settings = await prisma.settings.findFirst();
    const retentionMonths = settings?.retentionMonths || parseInt(process.env.DATA_RETENTION_MONTHS || '12');

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

    console.log(`📅 Purging data older than ${cutoffDate.toISOString().split('T')[0]}`);

    // Delete old messages
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Deleted ${deletedMessages.count} old messages`);

    // Delete empty chats
    const emptyChats = await prisma.chat.findMany({
      where: {
        messages: {
          none: {},
        },
      },
    });

    if (emptyChats.length > 0) {
      const deletedChats = await prisma.chat.deleteMany({
        where: {
          messages: {
            none: {},
          },
        },
      });

      console.log(`✅ Deleted ${deletedChats.count} empty chats`);
    }

    // Get database size info
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT chatId) as total_chats,
        SUM(totalTokens) as total_tokens
      FROM messages
    `;

    console.log('📊 Current database stats:');
    console.log(`   Messages: ${stats[0]?.total_messages || 0}`);
    console.log(`   Chats: ${stats[0]?.total_chats || 0}`);
    console.log(`   Total Tokens: ${stats[0]?.total_tokens?.toLocaleString() || 0}`);

    console.log('🎉 Annual data purge completed successfully!');

  } catch (error) {
    console.error('❌ Error during data purge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  purgeAnnualData();
}

export default purgeAnnualData;
