import express, { Request, Response } from 'express';
import db from '../database/database';
import { BaseResponse } from '../types/baseResponse';
import verifyToken from '../middleware/verifyToken';
import authRole from '../middleware/authRole';
import { Company } from '../types/types';
import { RunResult } from 'sqlite3';

const router = express.Router();

// Create a new company (Editor only)
router.post('/', verifyToken, authRole('Editor'), async (req: Request, res: Response): Promise<any> => {
    try {
        const { logo, name, status } = req.body as Company;

        // Basic validation (add more as needed)
        if (!logo || !name || !status) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Insert the new company into the database
        const insertCompany = db.prepare('INSERT INTO Company (logo, name, status) VALUES (?, ?, ?)');
        insertCompany.run(logo, name, status, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error creating company:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to create company' });
            }

            const newCompany: Company = {
                id: this.lastID, // Get the auto-generated ID
                logo,
                name,
                status,
            };

            const response: BaseResponse<Company> = {
                success: true,
                message: 'Company created successfully',
                data: newCompany,
            };

            res.status(201).json(response); // 201 Created status code
        });
        insertCompany.finalize();
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, error: 'Failed to create company' });
    }
});

// Get all companies
router.get('/', (req: Request, res: Response) => {
    try {
        db.all('SELECT * FROM Company', (err, rows: Company[]) => {
            if (err) {
                console.error('Error fetching companies:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to fetch companies' });
            }

            const response: BaseResponse<Company[]> = {
                success: true,
                data: rows,
            };

            res.json(response);
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch companies' });
    }
});

// Get company by ID
router.get('/:id', (req: Request, res: Response) => {
    try {
        const companyId = parseInt(req.params.id);

        db.get('SELECT * FROM Company WHERE id = ?', [companyId], (err, row: Company) => {
            if (err) {
                console.error('Error fetching company:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to fetch company' });
            }

            if (!row) {
                return res.status(404).json({ success: false, error: 'Company not found' });
            }

            const response: BaseResponse<Company> = {
                success: true,
                data: row,
            };

            res.json(response);
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch company' });
    }
});

// Update an existing company (Editor only)
router.put('/:id', verifyToken, authRole('Editor'), async (req: Request, res: Response): Promise<any> => {
    try {
        const companyId = parseInt(req.params.id);
        const { logo, name, status } = req.body as Company;

        // Basic validation (add more as needed)
        if (!logo || !name || !status) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Update the company in the database
        const updateCompany = db.prepare('UPDATE Company SET logo = ?, name = ?, status = ? WHERE id = ?');
        updateCompany.run(logo, name, status, companyId, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error updating company:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to update company' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Company not found' });
            }

            const updatedCompany: Company = {
                id: companyId,
                logo,
                name,
                status,
            };

            const response: BaseResponse<Company> = {
                success: true,
                message: 'Company updated successfully',
                data: updatedCompany,
            };

            res.json(response);
        });
        updateCompany.finalize();
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ success: false, error: 'Failed to update company' });
    }
});

// Delete a company (Editor only)
router.delete('/:id', verifyToken, authRole('Editor'), (req: Request, res: Response) => {
    try {
        const companyId = parseInt(req.params.id);

        const deleteCompany = db.prepare('DELETE FROM Company WHERE id = ?');
        deleteCompany.run(companyId, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error deleting company:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to delete company' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Company not found' });
            }

            res.json({ success: true, message: 'Company deleted successfully' });
        });
        deleteCompany.finalize();
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ success: false, error: 'Failed to delete company' });
    }
});

export default router;
