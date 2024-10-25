import express, { Request, Response } from 'express';
import db from '../database/database';

import { BaseResponse } from '../types/baseResponse';
import verifyToken from '../middleware/verifyToken';
import authRole from '../middleware/authRole';
import { RunResult } from 'sqlite3';
import { User } from '../types/types';

const router = express.Router();

// Create a new user (Editor only)
router.post('/', verifyToken, authRole('Editor'), async (req, res): Promise<any> => {
    try {
        const { firstname, lastname, email, password, type, status } = req.body as User;

        // Basic validation (add more as needed)
        if (!firstname || !lastname || !email || !password || !type || !status) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Insert the new user into the database
        const insertUser = db.prepare(
            'INSERT INTO User (firstname, lastname, email, password, type, status) VALUES (?, ?, ?, ?, ?, ?)',
        );
        insertUser.run(firstname, lastname, email, password, type, status, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error creating user:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to create user' });
            }

            const newUser: User = {
                id: this.lastID, // Get the auto-generated ID
                firstname,
                lastname,
                email,
                password,
                type,
                status,
            };

            const response: BaseResponse<User> = {
                success: true,
                message: 'User created successfully',
                data: newUser,
            };

            res.status(201).json(response); // 201 Created status code
        });
        insertUser.finalize();
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
});

// Get all users (Editor only)
router.get('/', verifyToken, authRole('Editor'), (req: Request, res: Response) => {
    try {
        db.all('SELECT * FROM User', (err, rows: User[]) => {
            if (err) {
                console.error('Error fetching users:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to fetch users' });
            }

            const response: BaseResponse<User[]> = {
                success: true,
                data: rows,
            };

            res.json(response);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Get user by ID (Editor only)
router.get('/:id', verifyToken, authRole('Editor'), (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        db.get('SELECT * FROM User WHERE id = ?', [userId], (err, row: User) => {
            if (err) {
                console.error('Error fetching user:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to fetch user' });
            }

            if (!row) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const response: BaseResponse<User> = {
                success: true,
                data: row,
            };

            res.json(response);
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
});

// Update an existing user (Editor only)
router.put('/:id', verifyToken, authRole('Editor'), async (req, res): Promise<any> => {
    try {
        const userId = parseInt(req.params.id);
        const { firstname, lastname, email, password, type, status } = req.body as User;

        // Basic validation (add more as needed)
        if (!firstname || !lastname || !email || !password || !type || !status) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Update the user in the database
        const updateUser = db.prepare(
            'UPDATE User SET firstname = ?, lastname = ?, email = ?, password = ?, type = ?, status = ? WHERE id = ?',
        );
        updateUser.run(
            firstname,
            lastname,
            email,
            password,
            type,
            status,
            userId,
            function (this: RunResult, err: Error) {
                if (err) {
                    console.error('Error updating user:', err.message);
                    return res.status(500).json({ success: false, error: 'Failed to update user' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ success: false, error: 'User not found' });
                }

                const updatedUser: User = {
                    id: userId,
                    firstname,
                    lastname,
                    email,
                    password,
                    type,
                    status,
                };

                const response: BaseResponse<User> = {
                    success: true,
                    message: 'User updated successfully',
                    data: updatedUser,
                };

                res.json(response);
            },
        );
        updateUser.finalize();
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// Delete a user (Editor only)
router.delete('/:id', verifyToken, authRole('Editor'), (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        const deleteUser = db.prepare('DELETE FROM User WHERE id = ?');
        deleteUser.run(userId, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error deleting user:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to delete user' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            res.json({ success: true, message: 'User deleted successfully' });
        });
        deleteUser.finalize();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

export default router;
