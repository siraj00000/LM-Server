import Account from '../models/accounts.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
const authAdmin = async (req, res, next) => {
    try {
        const account = await Account.findOne({
            _id: req.account?.id
        });
        if (account?.role !== 'Super Admin')
            return next(new ErrorResponse(400, 'Admin resources are denied'));
        next();
    }
    catch (error) {
        next(error);
    }
};
export const authCompanyAdmin = async (req, res, next) => {
    try {
        const account = await Account.findOne({
            _id: req.account?.id
        });
        if (account?.role !== 'Company Admin')
            return next(new ErrorResponse(400, 'Admin resources are denied'));
        next();
    }
    catch (error) {
        next(error);
    }
};
export const authManufacturerAdmin = async (req, res, next) => {
    try {
        const account = await Account.findOne({
            _id: req.account?.id
        });
        if (account?.role !== 'Manufacturer Admin')
            return next(new ErrorResponse(400, 'Admin resources are denied'));
        next();
    }
    catch (error) {
        next(error);
    }
};
export const multiAuthAdminProtection = async (req, res, next) => {
    try {
        const account = await Account.findOne({
            _id: req.account?.id
        });
        if (!['Super Admin', 'Company Admin'].includes(account?.role))
            return next(new ErrorResponse(400, 'Admin resources are denied'));
        next();
    }
    catch (error) {
        next(error);
    }
};
export const allAuthAdminProtection = async (req, res, next) => {
    try {
        const account = await Account.findOne({
            _id: req.account?.id
        });
        if (!['Super Admin', 'Company Admin', 'Manufacturer Admin'].includes(account?.role))
            return next(new ErrorResponse(400, 'Admin resources are denied'));
        next();
    }
    catch (error) {
        next(error);
    }
};
export default authAdmin;
//# sourceMappingURL=auth_admin.middleware.js.map