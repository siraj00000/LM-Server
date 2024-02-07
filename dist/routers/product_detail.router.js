import express from 'express';
import product_detailsController from '../controllers/product_details.controller.js';
const productDetailRouter = express.Router();
productDetailRouter
    .get('/:dsN/:link', product_detailsController.productDetailPage);
export default productDetailRouter;
//# sourceMappingURL=product_detail.router.js.map