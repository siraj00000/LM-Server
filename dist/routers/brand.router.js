import express from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import authAdmin from '../middleware/auth_admin.middleware.js';
import brandController from '../controllers/brand.controller.js';
import { upload } from '../middleware/upload_file.middleware.js';
const brandRouters = express.Router();
brandRouters
    .post('/create', protectMiddleware, authAdmin, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video' }]), brandController.createBrand)
    .get('/getAll', protectMiddleware, authAdmin, brandController.getAllBrands)
    .put('/updateOne/:id', protectMiddleware, authAdmin, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video' }]), brandController.updateBrand)
    .put('/toggleStatus/:id', protectMiddleware, authAdmin, brandController.toggleBrandStatus)
    .delete('/destroyImages/:id', protectMiddleware, authAdmin, brandController.destroyImages)
    .delete('/deleteOne/:id', protectMiddleware, authAdmin, brandController.deleteOneBrand)
    .delete('/deleteMany', protectMiddleware, authAdmin, brandController.deleteManyBrands);
export default brandRouters;
//# sourceMappingURL=brand.router.js.map