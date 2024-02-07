import express, { Router } from 'express';
import product_detailsController from '../controllers/product_details.controller.js';
const productDetailRouter: Router = express.Router();

productDetailRouter
    .get('/:dsN/:link', product_detailsController.productDetailPage);


export default productDetailRouter;
