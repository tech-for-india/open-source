import rateLimit from 'express-rate-limit';

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60'), // limit each IP to 60 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for chat endpoints
export const chatRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || '30'), // limit each IP to 30 chat requests per minute
  message: {
    error: 'Too many chat requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
