import { validateMimeType } from "../utils/validate_mimetype.utils.js";
import { ErrorResponse } from "../utils/error_response.utils.js";
import cloudinary from 'cloudinary';
import { removeTmp } from "../utils/remove_folder.utils.js";
import Warranty from "../models/warranty.model.js";
import Label from "../models/label.model.js";
class WarrantyController {
    async warrantyRegistration(req, res, next) {
        try {
            // Extract data from the requested body
            const warrantyInfo = req.body;
            const { DS1 } = warrantyInfo;
            if (!DS1)
                throw new ErrorResponse(400, "Invalid Warranty");
            const label = await Label.find({ DS1: { $in: `DS1/${DS1}` } })
                .populate({
                path: 'manufacture_id', select: 'company_id', model: 'Manufacturer'
            });
            const getObjectValue = (obj, key) => {
                return obj[key];
            };
            const company_id = getObjectValue(label[0]?.manufacture_id, "company_id");
            warrantyInfo.company_id = company_id;
            // Check if an image file (logo) was uploaded
            if (req.file) {
                // Validate the image file type (e.g., check mime type)
                const isValidFile = validateMimeType(req.file); // Implement your validation function
                if (!isValidFile) {
                    throw new ErrorResponse(400, 'Invalid image type');
                }
                // Upload the logo image to Cloudinary
                let invoice_image = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'warrany-invoices' // Set the folder name to store coupon logos in Cloudinary
                });
                // Remove the temporary image file
                removeTmp(req.file.path); // Implement your function to remove temporary files
                // Set the logo URL to the Cloudinary secure URL
                warrantyInfo.invoice_image = invoice_image.secure_url;
            }
            await Warranty.create(warrantyInfo);
            res.status(201).json({
                success: true,
                message: "Product has been registered!",
            });
        }
        catch (error) {
            console.log(error);
            next(error);
        }
    }
    async updateWarranty(req, res, next) {
        try {
            const { id } = req.params;
            const warrantyInfo = req.body;
            await Warranty.findByIdAndUpdate(id, warrantyInfo, { new: true });
            res.status(201).json({
                success: true,
                message: "Product warranty info has been updated!"
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getWarranties(req, res, next) {
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
            const categories = await Warranty.find(filter).where({ user_id: req.account?._id }).sort(sort).skip(skip).limit(limit);
            // Calculate the total count of matching categories (for pagination)
            const totalCount = await Warranty.countDocuments(filter);
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
    async getWarrantyById(req, res, next) {
        try {
            const { id } = req.params;
            const warranty = await Warranty.findById(id);
            res.status(200).json({
                success: true,
                data: warranty
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new WarrantyController();
//# sourceMappingURL=warranty.controller.js.map