import express from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import companyController from '../controllers/company.controller.js';
import authAdmin from '../middleware/auth_admin.middleware.js';
const companyRouter = express.Router();
companyRouter
    // Create a new company
    .post('/create', protectMiddleware, authAdmin, companyController.createCompany)
    // Get all subcategories
    .get('/getAll', protectMiddleware, authAdmin, companyController.getAllCompanies)
    // Get name and id of category
    .get('/getNameAndId', protectMiddleware, authAdmin, companyController.getIdAndName)
    // Update a company toggle status by ID
    .put('/toggleStatus/:id', protectMiddleware, authAdmin, companyController.toggleStatus)
    // Update a company by ID
    .put('/updateOne/:id', protectMiddleware, authAdmin, companyController.updateById)
    // Delete a company by ID
    .delete('/deleteOne/:id', protectMiddleware, authAdmin, companyController.deleteOne)
    // Delete many company by IDs
    .delete('/deleteMultiple', protectMiddleware, authAdmin, companyController.deleteMultiple)
    // Upload company: JSON or CSV format only
    .put('/upload-company/:id', protectMiddleware, authAdmin, companyController.createCompaniesFromJsonOrCsv);
export default companyRouter;
//# sourceMappingURL=company.router.js.map