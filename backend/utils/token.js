import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify JWT token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw error;
    }
};

// Decode token without verification (for inspection)
export const decodeToken = (token) => {
    return jwt.decode(token);
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

// Generate token pair (access + refresh)
export const generateTokenPair = (payload) => {
    return {
        accessToken: generateToken(payload, '7d'),
        refreshToken: generateRefreshToken(payload)
    };
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};
