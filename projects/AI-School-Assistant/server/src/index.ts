import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoPretty from 'pino-pretty';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chats';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Create logger
const logger = pino(
  pinoPretty({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  })
);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS - Disabled for same-origin (LAN-only deployment)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting - Temporarily disabled for development
// app.use(rateLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 AI School Assistant Server running on port ${PORT}`);
  logger.info(`📱 Access from LAN: http://YOUR_MACHINE_IP:${PORT}`);
  logger.info(`🏫 School: ${process.env.SCHOOL_NAME || 'AI School Assistant'}`);
  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
