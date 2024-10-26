import express, { Request, Response } from 'express';
import db from '../database/database';
import { BaseResponse } from '../types/baseResponse';
import verifyToken from '../middleware/verifyToken';
import authRole from '../middleware/authRole';
import { RunResult } from 'sqlite3';
import { Article } from '../types/types';

const router = express.Router();

// Create a new article (Writer only)
router.post('/', verifyToken, authRole('Writer'), async (req: Request, res: Response): Promise<any> => {
    try {
        const { image, title, link, date, content, companyId } = req.body as Article;
        const writerId = req.user?.id; // Get the writer's ID from the token

        // Basic validation (add more as needed)
        if (!image || !title || !link || !date || !content || !companyId) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Insert the new article into the database
        const insertArticle = db.prepare(
            'INSERT INTO Article (image, title, link, date, content, status, writerId, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        );
        insertArticle.run(
            image,
            title,
            link,
            date,
            content,
            'For Edit',
            writerId,
            companyId,
            function (this: RunResult, err: Error) {
                if (err) {
                    console.error('Error creating article:', err.message);
                    return res.status(500).json({ success: false, error: 'Failed to create article' });
                }

                const newArticle: Article = {
                    id: this.lastID, // Get the auto-generated ID
                    image,
                    title,
                    link,
                    date,
                    content,
                    status: 'For Edit',
                    writerId,
                    companyId,
                };

                const response: BaseResponse<Article> = {
                    success: true,
                    message: 'Article created successfully',
                    data: newArticle,
                };

                res.status(201).json(response); // 201 Created status code
            },
        );
        insertArticle.finalize();
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ success: false, error: 'Failed to create article' });
    }
});

// Get all articles
router.get('/', async (req: Request, res: Response) => {
    try {
        db.all(
            `
              SELECT 
                Article.*, 
                User.firstname || ' ' || User.lastname AS writerName,
                Editor.firstname || ' ' || Editor.lastname AS editorName
            FROM Article
            LEFT JOIN User ON Article.writerId = User.id
            LEFT JOIN User AS Editor ON Article.editorId = Editor.id
        `,
            (err, rows) => {
                if (err) {
                    console.error('Error fetching articles:', err.message);
                    return res.status(500).json({ success: false, error: 'Failed to fetch articles' });
                }

                const response: BaseResponse<any[]> = {
                    success: true,
                    data: rows,
                };

                res.json(response);
            },
        );
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
});

// Update an existing article (Writer and Editor with restrictions)
router.put('/:id', verifyToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const articleId = parseInt(req.params.id);
        const { image, title, link, date, content, companyId } = req.body as Article;
        const userId = req.user?.id;
        const userType = req.user?.type;

        // Basic validation (add more as needed)
        if (!image || !title || !link || !date || !content || !companyId) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        db.get('SELECT id FROM Company WHERE id = ?', [companyId], (err, company) => {
            if (err) {
                console.error('Error checking company:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to check company' });
            }

            if (!company) {
                return res.status(400).json({ success: false, error: 'Invalid companyId' });
            }

            // Get the article's current status and writerId from the database
            db.get('SELECT status, writerId FROM Article WHERE id = ?', [articleId], (err, row: Article) => {
                if (err) {
                    console.error('Error fetching article:', err.message);
                    return res.status(500).json({ success: false, error: 'Failed to fetch article' });
                }

                if (!row) {
                    return res.status(404).json({ success: false, error: 'Article not found' });
                }

                // Check if the user is authorized to update the article
                if (userType === 'Writer' && row.status === 'Published') {
                    return res.status(403).json({ success: false, error: 'Cannot edit a published article' });
                } else if (userType === 'Writer' && row.writerId !== userId) {
                    return res.status(403).json({ success: false, error: "Cannot edit another writer's article" });
                }

                // Update the article in the database
                const updateArticle = db.prepare(
                    'UPDATE Article SET image = ?, title = ?, link = ?, date = ?, content = ?, companyId = ? WHERE id = ?',
                );
                updateArticle.run(
                    image,
                    title,
                    link,
                    date,
                    content,
                    companyId,
                    articleId,
                    function (this: RunResult, err: Error) {
                        if (err) {
                            console.error('Error updating article:', err.message);
                            return res.status(500).json({ success: false, error: 'Failed to update article' });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({ success: false, error: 'Article not found' });
                        }

                        const updatedArticle: Article = {
                            id: articleId,
                            image,
                            title,
                            link,
                            date,
                            content,
                            status: row.status, // Keep the original status
                            writerId: row.writerId, // Keep the original writerId
                            companyId,
                        };

                        const response: BaseResponse<Article> = {
                            success: true,
                            message: 'Article updated successfully',
                            data: updatedArticle,
                        };

                        res.json(response);
                    },
                );
                updateArticle.finalize();
            });
        });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ success: false, error: 'Failed to update article' });
    }
});

// Publish an article (Editor only)
router.patch('/:id/publish', verifyToken, authRole('Editor'), async (req: Request, res: Response) => {
    try {
        const articleId = parseInt(req.params.id);
        const editorId = req.user?.id; // Get the editor's ID from the token

        // Update the article status and set the editorId in the database
        const publishArticle = db.prepare('UPDATE Article SET status = ?, editorId = ? WHERE id = ?');
        publishArticle.run('Published', editorId, articleId, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error publishing article:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to publish article' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }

            res.json({ success: true, message: 'Article published successfully' });
        });
        publishArticle.finalize();
    } catch (error) {
        console.error('Error publishing article:', error);
        res.status(500).json({ success: false, error: 'Failed to publish article' });
    }
});

// Get article by ID
router.get('/:id', (req: Request, res: Response) => {
    try {
        const articleId = parseInt(req.params.id);

        db.get('SELECT * FROM Article WHERE id = ?', [articleId], (err, row: Article) => {
            if (err) {
                console.error('Error fetching article:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to fetch article' });
            }

            if (!row) {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }

            const response: BaseResponse<Article> = {
                success: true,
                data: row,
            };

            res.json(response);
        });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
});

// Delete an article (Editor only)
router.delete('/:id', verifyToken, authRole('Editor'), (req: Request, res: Response) => {
    try {
        const articleId = parseInt(req.params.id);

        const deleteArticle = db.prepare('DELETE FROM Article WHERE id = ?');
        deleteArticle.run(articleId, function (this: RunResult, err: Error) {
            if (err) {
                console.error('Error deleting article:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to delete article' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }

            res.json({ success: true, message: 'Article deleted successfully' });
        });
        deleteArticle.finalize();
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ success: false, error: 'Failed to delete article' });
    }
});

export default router;
