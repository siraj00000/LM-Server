import express from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import labelController from '../controllers/label.controller.js';
import { authManufacturerAdmin } from '../middleware/auth_admin.middleware.js';
const labelRouters = express.Router();
labelRouters
    .post('/create', protectMiddleware, authManufacturerAdmin, labelController.createLabel)
    .get('/getAll', protectMiddleware, authManufacturerAdmin, labelController.getAllLabels)
    .put('/updateOne/:id', protectMiddleware, authManufacturerAdmin, labelController.updateLabel)
    .put('/updateMany', protectMiddleware, authManufacturerAdmin, labelController.updateManyLabels)
    .put('/toggleStatus/:id', protectMiddleware, authManufacturerAdmin, labelController.toggleLabelStatus)
    .delete('/deleteOne/:id', protectMiddleware, authManufacturerAdmin, labelController.deleteOneLabel)
    .delete('/deleteMany', protectMiddleware, authManufacturerAdmin, labelController.deleteManyLabels)
    .get('/download-csv', protectMiddleware, authManufacturerAdmin, labelController.downloadCSV);
export default labelRouters;
//# sourceMappingURL=label.router.js.map