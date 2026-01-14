// Role-based access control middleware
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
};

// Check if user is admin
export const isAdmin = authorize('admin');

// Check if user is admin or the resource owner
export const isAdminOrOwner = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userRole = req.user.role;
        const resourceUserId = req.params[userIdParam] || req.body[userIdParam] || req.query[userIdParam];
        const currentUserId = req.user.userId;

        // Allow if admin or if user owns the resource
        if (userRole === 'admin' || currentUserId === resourceUserId) {
            return next();
        }

        return res.status(403).json({ 
            message: 'Access denied. You can only access your own resources.',
        });
    };
};
