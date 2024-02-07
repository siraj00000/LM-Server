import { Response } from 'express';

export class ErrorResponse {
    statusCode: number;
    message: string;

    constructor(statusCode: number, message: string) {
        this.statusCode = statusCode;
        this.message = message;
    }

    send(res: Response): void {
        res.status(this.statusCode).json({ error: this.message });
    }
}