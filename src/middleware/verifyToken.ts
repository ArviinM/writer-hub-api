import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config';

interface UserPayload {
    userId: number;
    userType: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: { id: number; type: string };
        }
    }
}

const verifyToken = (req: Request, res: Response, next: NextFunction): any => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header

        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload; // Verify and decode the token

        // Attach user information to the request object
        req.user = {
            id: decoded.userId,
            type: decoded.userType,
        };

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(403).json({ success: false, error: 'Invalid token' });
    }
};

export default verifyToken;
