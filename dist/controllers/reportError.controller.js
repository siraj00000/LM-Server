import ErrorReport from "../models/reportError.model.js";
import Brand from "../models/brand.model.js";
import { ErrorResponse } from "../utils/error_response.utils.js";
class ReportErrorController {
    async reportError(req, res, next) {
        try {
            const errorReportInfo = req.body;
            const brand = await Brand.findById(errorReportInfo.brand_id).select("company_id");
            if (!brand)
                throw new ErrorResponse(400, "Invalid Brand");
            errorReportInfo.company_id = brand.company_id;
            await ErrorReport.create(errorReportInfo);
            res.status(201).json({
                success: true,
                message: "Error report registered!"
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getErrorReports(req, res, next) {
        try {
            // Define pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Define sorting options
            const sortBy = req.query.sortBy || 'purchase_date';
            const sortOrder = (req.query.sortOrder || 'asc') === 'desc' ? 'desc' : 'asc';
            // Define search criteria
            const purchaseDateQuery = req.query.purchase_date || '';
            // Build the filter object based on search criteria
            const filter = {};
            if (purchaseDateQuery) {
                filter['purchase_date'] = { $regex: new RegExp(purchaseDateQuery, 'i') };
            }
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            // Define sort object for MongoDB
            const sort = {};
            sort[sortBy] = sortOrder;
            // Query the database with pagination, sorting, and filtering
            const categories = await ErrorReport.find(filter).where({ user_id: req.account?._id }).sort(sort).skip(skip).limit(limit);
            // Calculate the total count of matching categories (for pagination)
            const totalCount = await ErrorReport.countDocuments(filter);
            // Respond with the paginated and sorted categories
            res.status(200).json({
                success: true,
                data: categories,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            });
        }
        catch (error) {
            // Handle any errors that may occur during category retrieval
            next(error);
        }
    }
}
export default new ReportErrorController();
//# sourceMappingURL=reportError.controller.js.map