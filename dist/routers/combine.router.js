import express from 'express';
import authAdmin, { allAuthAdminProtection, authCompanyAdmin, authManufacturerAdmin, multiAuthAdminProtection } from '../middleware/auth_admin.middleware.js';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import combineController from '../controllers/combine.controller.js';
const combineRouter = express.Router();
combineRouter
    .get('/associates-collections', protectMiddleware, authAdmin, combineController.fetchAccessibiltyAssociatesCollections)
    .get('/roles', protectMiddleware, authAdmin, combineController.roleBasedInfo)
    .get('/fetch-company-brands', protectMiddleware, authCompanyAdmin, combineController.fetchCompanyBrands)
    .get('/fetch-company-subcategories', protectMiddleware, authCompanyAdmin, combineController.fetchCompanySubcategories)
    .post('/fetch-brands-for-all', protectMiddleware, allAuthAdminProtection, combineController.fetchBrandForAll)
    .get('/fetch-manufacturers-company-brands', protectMiddleware, authManufacturerAdmin, combineController.fetchManufacturerBrands)
    .post('/fetch-brand-products', protectMiddleware, authManufacturerAdmin, combineController.fetchManufacturerBrandProducts)
    .get('/fetch-companies', protectMiddleware, multiAuthAdminProtection, combineController.fetchCompanies)
    .post('/fetch-companies-manufacturer', protectMiddleware, multiAuthAdminProtection, combineController.fetchCompaniesManufacturers)
    .post('/fetch-brands-products', protectMiddleware, allAuthAdminProtection, combineController.fetchMultiManufacturerBrandProducts)
    .post('/super-admin-label-stats', protectMiddleware, authAdmin, combineController.superAdminLabelStats)
    .post('/company-label-stats', protectMiddleware, authCompanyAdmin, combineController.companyLabelStats)
    .post('/manufacturer-label-stats', protectMiddleware, authManufacturerAdmin, combineController.manufacturerLabelStats)
    .post('/label-batchs-and-variants', protectMiddleware, authManufacturerAdmin, combineController.getBatchNumbersAndVariants)
    .post('/label-batch-numbers', protectMiddleware, authManufacturerAdmin, combineController.labelBatchNumbers)
    .post('/label-variants', protectMiddleware, authManufacturerAdmin, combineController.labelVariants)
    .post('/multiple-label-variants', protectMiddleware, allAuthAdminProtection, combineController.multipleLabelVariants)
    .post('/products-variants', protectMiddleware, allAuthAdminProtection, combineController.fetchProductVariants)
    .post('/label-count', protectMiddleware, authManufacturerAdmin, combineController.labelCountInRange)
    .post('/filter-and-download-csv', protectMiddleware, multiAuthAdminProtection, combineController.filterAndDownloadLabelCSV)
    .post('/manufacturer-filter-and-csv', protectMiddleware, authManufacturerAdmin, combineController.manufacturerLabelFilterAndCSVDownload)
    .post('/warranties-csv', protectMiddleware, combineController.warrantiesCSVDownload)
    .post('/reqhelp-csv', protectMiddleware, combineController.reqHelpOnLabelCSVDownload)
    .post('/error-report-csv', protectMiddleware, combineController.reportErrorCSVDownload);
export default combineRouter;
//# sourceMappingURL=combine.router.js.map