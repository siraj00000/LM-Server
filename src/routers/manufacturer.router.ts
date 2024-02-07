import express, { Router } from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import manufacturerController from '../controllers/manufacturer.controller.js';
import authAdmin from '../middleware/auth_admin.middleware.js';

const manufacturerRouter: Router = express.Router();

manufacturerRouter
    // Create a new manufacturer
    .post('/create', protectMiddleware, authAdmin, manufacturerController.createManufacturer)

    // Get all manufacturers
    .get('/getAll', protectMiddleware, authAdmin, manufacturerController.getAllManufacturers)

    // Get ID and name of manufacturers
    .get('/getIdAndName', protectMiddleware, authAdmin, manufacturerController.getIdAndName)

    // Get manufacturer by ID
    .get('/:id', protectMiddleware, authAdmin, manufacturerController.getManufacturerById)

    // Update manufacturer toggle status by ID
    .put('/toggleStatus/:id', protectMiddleware, authAdmin, manufacturerController.toggleManufacturerStatus)

    // Update manufacturer by ID
    .put('/updateOne/:id', protectMiddleware, authAdmin, manufacturerController.updateManufacturerById)

    // Delete manufacturer by ID
    .delete('/deleteOne/:id', protectMiddleware, authAdmin, manufacturerController.deleteManufacturerById)

    // Delete multiple manufacturers by IDs
    .delete('/deleteMultiple', protectMiddleware, authAdmin, manufacturerController.deleteMultipleManufacturers);

export default manufacturerRouter;