import express from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import subcategoryController from '../controllers/subcategory.controller.js';
import authAdmin from '../middleware/auth_admin.middleware.js';
const subcategoryRouter = express.Router();
subcategoryRouter
    // Create a new subcategory
    .post('/create', protectMiddleware, authAdmin, subcategoryController.createSubcategory)
    // Get all subcategories
    .get('/getAll', protectMiddleware, authAdmin, subcategoryController.getAllSubcategories)
    // Get name and id of category
    .get('/getNameAndId', protectMiddleware, authAdmin, subcategoryController.getIdAndName)
    // Update a subcategory toggle status by ID
    .put('/toggleStatus/:id', protectMiddleware, authAdmin, subcategoryController.toggleStatus)
    // Update a subcategory by ID
    .put('/updateOne/:id', protectMiddleware, authAdmin, subcategoryController.updateSubcategoryById)
    // Delete a subcategory by ID
    .delete('/deleteOne/:id', protectMiddleware, authAdmin, subcategoryController.deleteSubcategoryById)
    // Delete many subcategory by IDs
    .delete('/deleteMultiple', protectMiddleware, authAdmin, subcategoryController.deleteMultiple)
    // Add features to a subcategory by ID
    .put('/addFeatures/:id', protectMiddleware, authAdmin, subcategoryController.addFeaturesToSubcategory)
    // Remove features from a subcategory by ID
    .put('/removeFeatures/:id', protectMiddleware, authAdmin, subcategoryController.removeFeaturesFromSubcategory);
export default subcategoryRouter;
//# sourceMappingURL=subcategory.router.js.map