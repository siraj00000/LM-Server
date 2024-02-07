import jwt from 'jsonwebtoken';
import Account from '../models/accounts.model.js';
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('Authorization required');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const account = await Account.findById(decoded.id);
        if (!account) {
            throw new Error('Invalid authorization');
        }
        req.account = account;
        next();
    }
    catch (error) {
        res.status(401).json({ message: error });
    }
};
export default authMiddleware;
//# sourceMappingURL=authenticate.middleware.js.map