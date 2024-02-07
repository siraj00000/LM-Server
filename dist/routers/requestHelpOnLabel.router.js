import express from 'express';
import RequestHelpOnLabel from '../controllers/requestHelpOnLabel.controller.js';
const requestHelpOnLabelRouter = express.Router();
requestHelpOnLabelRouter
    .post('/createRequest', RequestHelpOnLabel.createRequest)
    .get('/get-requests/:id', RequestHelpOnLabel.getRequestById)
    .put('/update-request', RequestHelpOnLabel.updateAddressAndPincode);
export default requestHelpOnLabelRouter;
//# sourceMappingURL=requestHelpOnLabel.router.js.map