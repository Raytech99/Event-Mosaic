const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Received token:', token ? token.substring(0, 20) + '...' : 'none');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Debug: Check if JWT_SECRET is available
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified, user:', verified);

        if (!verified) {
            return res.status(401).json({ error: 'Token verification failed, authorization denied' });
        }

        // Add user info to request
        req.user = verified;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = auth; 