// routes/auth.ts
import express from 'express';
import db from '../database/database';
import { BaseResponse } from '../types/baseResponse';
import { User } from '../types/types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from '../config/config';

const router = express.Router();

router.post('/login', async (req, res): Promise<any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        db.get('SELECT * FROM User WHERE email = ? AND password = ?', [email, password], (err, row: User) => {
            if (err) {
                console.error('Error logging in:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to log in' });
            }

            if (!row) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            const accessToken = jwt.sign({ userId: row.id, userType: row.type }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ userId: row.id, userType: row.type }, REFRESH_TOKEN_SECRET);

            const response: BaseResponse<User> = {
                success: true,
                message: 'Login successful',
                data: { ...row, accessToken, refreshToken },
            };

            return res.json(response);
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

router.post('/refresh', (req, res): any => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, error: 'Refresh token required' });
        }

        // Verify the refresh token
        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err: any, user: any) => {
            if (err) {
                return res.status(403).json({ success: false, error: 'Invalid refresh token' });
            }

            // Generate a new access token
            const accessToken = jwt.sign({ userId: user.userId, userType: user.userType }, JWT_SECRET, {
                expiresIn: '1h',
            });

            return res.json({ success: true, accessToken });
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ success: false, error: 'Failed to refresh token' });
    }
});

export default router;
