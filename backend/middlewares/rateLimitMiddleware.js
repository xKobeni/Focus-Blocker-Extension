// Simple in-memory rate limiter
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Rate limiting middleware
export const rateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes default
        max = 100, // 100 requests default
        message = 'Too many requests, please try again later',
        skipSuccessfulRequests = false,
        skipFailedRequests = false
    } = options;

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        // Get or create rate limit entry
        let rateLimitInfo = rateLimitStore.get(key);

        if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
            // Create new rate limit entry
            rateLimitInfo = {
                count: 0,
                resetTime: now + windowMs
            };
            rateLimitStore.set(key, rateLimitInfo);
        }

        // Check if limit exceeded
        if (rateLimitInfo.count >= max) {
            const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
            
            res.setHeader('Retry-After', retryAfter);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString());
            
            return res.status(429).json({
                message,
                retryAfter
            });
        }

        // Increment counter
        rateLimitInfo.count++;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateLimitInfo.count));
        res.setHeader('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString());

        // Track response status if needed
        if (skipSuccessfulRequests || skipFailedRequests) {
            const originalSend = res.send;
            res.send = function (data) {
                const statusCode = res.statusCode;
                if ((skipSuccessfulRequests && statusCode < 400) || 
                    (skipFailedRequests && statusCode >= 400)) {
                    rateLimitInfo.count--;
                }
                return originalSend.call(this, data);
            };
        }

        next();
    };
};

// Strict rate limit for authentication endpoints
// In development: more lenient, In production: strict
const isDevelopment = process.env.NODE_ENV !== 'production';

export const authRateLimit = rateLimit({
    windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min dev, 15 min prod
    max: isDevelopment ? 50 : 10, // 50 requests in dev, 10 in prod
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true // Don't count successful logins
});

// General API rate limit
export const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 500 : 100, // More lenient in development
    message: 'Too many requests, please try again later'
});
