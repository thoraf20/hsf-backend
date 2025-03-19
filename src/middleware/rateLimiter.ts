import rateLimit from 'express-rate-limit'

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

export default rateLimiter
