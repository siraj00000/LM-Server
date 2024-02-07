import express, { Router } from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import authAdmin from '../middleware/auth_admin.middleware.js';
import CategoryController from '../controllers/category.controller.js';
import { upload } from '../middleware/upload_file.middleware.js';

const categoryRouter: Router = express.Router();

categoryRouter
    // Create a new category
    .post('/create', protectMiddleware, authAdmin, CategoryController.createCategory)

    // Get all categories
    .get('/getAll', protectMiddleware, CategoryController.getAll)

    // Get name and id of categories
    .get('/getNameAndId', protectMiddleware, CategoryController.getIdAndName)

    // Get all categories
    .get('/getAllCategories', protectMiddleware, CategoryController.getAllCategories)

    // Get a category by ID
    .get('/getById/:id', protectMiddleware, CategoryController.getById)

    // Update a category by ID
    .put('/updateById/:id', protectMiddleware, authAdmin, CategoryController.updateById)

    // Update all categories
    .put('/updateAll', protectMiddleware, authAdmin, CategoryController.updateAll)

    // Toggle category status by ID
    .put('/toggleStatus/:id', protectMiddleware, authAdmin, CategoryController.toggleStatus)

    // Toggle status of multiple categories based on the provided status (show/hide)
    .put('/multiToggleStatus', protectMiddleware, authAdmin, CategoryController.multiToggleStatus)

    // Delete one category by ID
    .delete('/deleteOne/:id', protectMiddleware, authAdmin, CategoryController.deleteOne)

    // Delete all categories
    .delete('/deleteMultiple', protectMiddleware, authAdmin, CategoryController.deleteMultiple)

    // Create categories by JSON or CSV file
    .post('/upload-categories', upload.single('file'), CategoryController.createCategoriesFromJsonOrCsv);

export default categoryRouter;
