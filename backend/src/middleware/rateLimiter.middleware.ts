import rateLimit from 'express-rate-limit';

// Applied to /api/v1/auth/* - generous enough for normal use/tests, tight
// enough to blunt credential-stuffing / brute force attempts.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many requests, please try again later.',
  },
});
