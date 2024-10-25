import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
    success: boolean;
    message: string;
    error?: any;
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    const response: ErrorResponse = {
        success: false,
        message: 'Something went wrong!',
    };

    if (err.name === 'ValidationError') {
        response.message = 'Invalid request data';
        response.error = err.message;
    } else if (err.name === 'NotFoundError') {
        response.message = 'Resource not found';
    }

    res.status(500).json(response); // Send the error response
};

export default errorHandler;
