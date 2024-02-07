import RequestHelpOnLabel from '../models/requestHelpOnLabel.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import Label from '../models/label.model.js';
class RequestHelpOnLabelController {
    async createRequest(req, res, next) {
        try {
            const { DS1, request_date, help_ref_num, address, pincode } = req.body;
            const label = await Label.findOne({ DS1: { $in: DS1 } })
                .select('brand_id product_id')
                .populate({
                path: "brand_id",
                select: "company_id",
                model: "Brand"
            });
            const body = {
                DS1,
                brand_id: label?.brand_id._id,
                product_id: label.product_id,
                company_id: label?.brand_id.company_id,
                request_date,
                help_ref_num,
                address,
                pincode
            };
            await RequestHelpOnLabel.create(body);
            res.status(201).json({
                success: true,
                message: "Help request posted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateAddressAndPincode(req, res, next) {
        try {
            const { requestId } = req.params;
            const { address, pincode } = req.body;
            const updatedRequest = await RequestHelpOnLabel.findByIdAndUpdate(requestId, { address, pincode }, { new: true });
            if (updatedRequest) {
                res.status(202).json({ success: true, message: "Updated Successfully" });
            }
            else {
                throw new ErrorResponse(404, "Request not found");
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getRequests(req, res, next) {
        try {
            // Define pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Define sorting options
            const sortBy = req.query.sortBy || 'store_name';
            const sortOrder = (req.query.sortOrder || 'asc') === 'desc' ? 'desc' : 'asc';
            // Define search criteria
            const storeNameQuery = req.query.store_name || '';
            // Build the filter object based on search criteria
            const filter = {};
            if (storeNameQuery) {
                filter['store_name'] = { $regex: new RegExp(storeNameQuery, 'i') };
            }
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            // Define sort object for MongoDB
            const sort = {};
            sort[sortBy] = sortOrder;
            // Query the database with pagination, sorting, and filtering
            const requests = await RequestHelpOnLabel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit);
            // Calculate the total count of matching requests (for pagination)
            const totalCount = await RequestHelpOnLabel.countDocuments(filter);
            // Respond with the paginated and sorted requests
            res.status(200).json({
                success: true,
                data: requests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit,
                },
            });
        }
        catch (error) {
            // Handle any errors that may occur during request retrieval
            next(error);
        }
    }
    async getRequestById(req, res, next) {
        try {
            const { requestId } = req.params;
            const request = await RequestHelpOnLabel.findById(requestId);
            if (request) {
                res.json(request);
            }
            else {
                res.status(404).json({ error: 'Request not found' });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
export default new RequestHelpOnLabelController();
//# sourceMappingURL=requestHelpOnLabel.controller.js.map