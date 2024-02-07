import express from 'express';
import ReportErrorController from '../controllers/reportError.controller.js';
const reportErrorRouter = express.Router();
reportErrorRouter
    .post('/report-error', ReportErrorController.reportError)
    .get('/get-report-error', ReportErrorController.getErrorReports);
export default reportErrorRouter;
//# sourceMappingURL=reportError.router.js.map