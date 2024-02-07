import express, { Router } from 'express';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import { authCompanyAdmin } from '../middleware/auth_admin.middleware.js';
import productController from '../controllers/product.controller.js';
import { upload } from '../middleware/upload_file.middleware.js';

const productRouters: Router = express.Router();

productRouters
    .post('/create', protectMiddleware, authCompanyAdmin, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video' }]), productController.createProduct)
    .get('/getAll', protectMiddleware, authCompanyAdmin, productController.getAllProduct)
    .put('/updateOne/:id', protectMiddleware, authCompanyAdmin, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video' }]), productController.updateProduct)
    .put('/toggleStatus/:id', protectMiddleware, authCompanyAdmin, productController.toggleProductStatus)
    .delete('/destroyImages/:id', protectMiddleware, authCompanyAdmin, productController.destroyImages)
    .delete('/deleteOne/:id', protectMiddleware, authCompanyAdmin, productController.deleteOneProduct)
    .delete('/deleteMany', protectMiddleware, authCompanyAdmin, productController.deleteManyProducts);

export default productRouters