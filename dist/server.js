import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import Logging from './library/Logging.mjs';
import { config } from './config/config.js';
import { errorHandler } from './middleware/error_handler.middleware.js';
// Routers
import accountRouters from './routers/account.router.js';
import productRouters from './routers/products.router.js';
import categoryRouter from './routers/category.router.js';
import subcategoryRouters from './routers/subcategory.router.js';
import manufacturerRouters from './routers/manufacturer.router.js';
import companyRouters from './routers/company.router.js';
import brandRouters from './routers/brand.router.js';
import labelRouters from './routers/label.router.js';
import combineRouter from './routers/combine.router.js';
import productDetailRouter from './routers/product_detail.router.js';
import warrantyRouter from './routers/warranty.router.js';
import requestHelpOnLabelRouter from './routers/requestHelpOnLabel.router.js';
import reportErrorRouter from './routers/reportError.router.js';
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const router = express();
/* connecting to database (MongoDB) */
mongoose
    .set({ strictQuery: false })
    .connect(config.mongo.url)
    .then(() => {
    Logging.info('MongoDB Connected');
    startServer();
})
    .catch((error) => {
    Logging.error(error);
});
/* Only start the server if Mongo connects  */
const startServer = () => {
    router.use((req, res, next) => {
        /* Log the Request */
        Logging.info(`Incomming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
        res.on('finish', () => {
            /* Log the Response */
            Logging.info(`Incomming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
        });
        next();
    });
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());
    /** Rules of our API */
    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method == 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }
        next();
    });
    /* Routes */
    router.use('/api/account', accountRouters);
    router.use('/api/product', productRouters);
    router.use('/api/category', categoryRouter);
    router.use('/api/brand', brandRouters);
    router.use('/api/subcategory', subcategoryRouters);
    router.use('/api/company', companyRouters);
    router.use('/api/manufacturer', manufacturerRouters);
    router.use('/api/label', labelRouters);
    router.use('/api/combine', combineRouter);
    router.use('/api/product_detail', productDetailRouter);
    router.use('/api/warranty', warrantyRouter);
    router.use('/api/report', reportErrorRouter);
    router.use('/api/request_help', requestHelpOnLabelRouter);
    router.use("/files", express.static('src/public/files'));
    /* Health Check */
    router.get('/ping', (req, res) => res.status(200).json({ message: 'pong' }));
    /* Error handling */
    router.use(errorHandler);
    const server = http.createServer(router).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}`));
    process.on('unhandledRejection', (err, promise) => {
        console.log(`Logged Error ${err}`);
        server.close(() => process.exit(1));
    });
};
//# sourceMappingURL=server.js.map