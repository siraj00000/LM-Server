import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Account, { IAccount } from '../models/accounts.model.js';

interface AuthenticatedRequest extends Request {
    account: IAccount;
}

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('Authorization required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string;
        };
        const account = await Account.findById(decoded.id);
        if (!account) {
            throw new Error('Invalid authorization');
        }

        req.account = account;
        next();
    } catch (error) {
        res.status(401).json({ message: error });
    }
};

export default authMiddleware;
