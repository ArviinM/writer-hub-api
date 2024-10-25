import { Request, Response, NextFunction } from 'express';

const authRole = (role: string): any => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.user?.type !== role) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        next();
    };
};

export default authRole;
