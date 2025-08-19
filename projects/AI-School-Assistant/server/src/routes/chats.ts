import { Router } from 'express';
import { prisma } from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { chatRateLimiter } from '../middleware/rateLimiter';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// List user's chats
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.query;
    const where: any = {};

    // Admin can filter by user
    if (req.user!.role !== 'USER' && userId) {
      where.userId = userId;
    } else {
      where.userId = req.user!.id;
    }

    const chats = await prisma.chat.findMany({
      where,
      include: {
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ chats });
  } catch (error) {
    next(error);
  }
});

// Create new chat
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { title } = req.body;

    const chat = await prisma.chat.create({
      data: {
        userId: req.user!.id,
        title: title || 'New Chat',
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
});

// Get chat messages
router.get('/:chatId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    // Check if user can access this chat
    if (chat.userId !== req.user!.id && req.user!.role === 'USER') {
      throw createError('Access denied', 403);
    }

    res.json({ chat });
  } catch (error) {
    next(error);
  }
});

// Delete chat
router.delete('/:chatId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    // Check if user can delete this chat
    if (chat.userId !== req.user!.id && req.user!.role === 'USER') {
      throw createError('Access denied', 403);
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Send message to AI
router.post('/:chatId/message', authenticateToken, chatRateLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, model = 'gpt-4o-mini' } = req.body;

    if (!content) {
      throw createError('Message content is required', 400);
    }

    // Verify chat exists and user has access
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw createError('Chat not found', 404);
    }

    if (chat.userId !== req.user!.id) {
      throw createError('Access denied', 403);
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'USER',
        content,
        model,
      },
    });

    // Update chat title if it's the first message
    if (chat.title === 'New Chat') {
      await prisma.chat.update({
        where: { id: chatId },
        data: { title: content.substring(0, 50) + (content.length > 50 ? '...' : '') },
      });
    }

    // Get chat history for context
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    // Prepare messages for OpenAI
    const openaiMessages = messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let assistantMessage = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: openaiMessages,
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantMessage += content;
        
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }

      // Get token usage from the last chunk
      if (stream.choices[0]?.finish_reason) {
        promptTokens = stream.usage?.prompt_tokens || 0;
        completionTokens = stream.usage?.completion_tokens || 0;
        totalTokens = stream.usage?.total_tokens || 0;
      }

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      res.write(`data: ${JSON.stringify({ error: 'AI service temporarily unavailable' })}\n\n`);
      res.end();
      return;
    }

    // Save assistant message
    await prisma.message.create({
      data: {
        chatId,
        role: 'ASSISTANT',
        content: assistantMessage,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
      },
    });

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Send completion signal
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();

  } catch (error) {
    next(error);
  }
});

export default router;
