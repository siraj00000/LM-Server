import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Account from '../models/accounts.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';

export const protectMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse(401, 'Not authorized to access this route'));
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

        const account = await Account.findById(decoded.id);

        if (!account) {
            return next(new ErrorResponse(404, 'No user found with this id'));
        }

        req.account = account;

        next();
    } catch (error) {
        return next(new ErrorResponse(401, 'Not authorized to access this route'));
    }
};
