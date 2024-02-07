import Manufacturer from '../models/manufacturer.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
class ManufacturerController {
    // Create a new manufacturer
    async createManufacturer(req, res, next) {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;
            const manufacturerInfo = req.body;
            await Manufacturer.create(manufacturerInfo);
            res.status(201).json({ success: true, message: 'Manufacturer created successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    // Method for retrieving all manufacturers with pagination, sorting, and searching by name
    async getAllManufacturers(req, res, next) {
        try {
            // Define pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Define sorting options
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = (req.query.sortOrder || 'asc') === 'desc' ? 'desc' : 'asc';
            // Define search criteria
            const nameQuery = req.query.name || '';
            // Build the filter object based on search criteria
            const filter = {};
            if (nameQuery) {
                filter['name'] = { $regex: new RegExp(nameQuery, 'i') };
            }
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            // Define sort object for MongoDB
            const sort = {};
            sort[sortBy] = sortOrder;
            // Query the database with pagination, sorting, and filtering
            const manufacturers = await Manufacturer.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                path: 'company_id',
                select: 'name',
                model: 'Company' // Assuming 'Company' is the name of the related model
            });
            const getObjectValue = (obj, key) => {
                return obj[key];
            };
            // Map the results and rename the 'company' field to 'companyObj'
            const manufacturerWithCompanyData = manufacturers.map((manufacturer) => ({
                ...manufacturer.toObject(),
                company: getObjectValue(manufacturer.company_id, 'name') // Rename to 'companyObj'
            }));
            // Calculate the total count of matching manufacturers (for pagination)
            const totalCount = await Manufacturer.countDocuments(filter);
            // Respond with the paginated and sorted manufacturers
            res.status(200).json({
                success: true,
                data: manufacturerWithCompanyData,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            });
        }
        catch (error) {
            // Handle any errors that may occur during manufacturer retrieval
            next(error);
        }
    }
    // Get all manufacturers' ID and name
    async getIdAndName(req, res, next) {
        try {
            const manufacturers = await Manufacturer.find().where({ status: 'active' }).select({ _id: 1, name: 1 });
            res.status(200).json({ success: true, data: manufacturers });
        }
        catch (error) {
            next(error);
        }
    }
    // Get manufacturer by ID
    async getManufacturerById(req, res, next) {
        try {
            const { id } = req.params;
            const manufacturer = await Manufacturer.findById(id);
            if (!manufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
            }
            res.status(200).json({ success: true, data: manufacturer });
        }
        catch (error) {
            next(error);
        }
    }
    // Update manufacturer by ID
    async updateManufacturerById(req, res, next) {
        try {
            const { id } = req.params;
            const updatedManufacturerInfo = req.body;
            const updatedManufacturer = await Manufacturer.findByIdAndUpdate(id, updatedManufacturerInfo, { new: true });
            if (!updatedManufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
            }
            res.status(200).json({ success: true, message: 'Manufacturer updated!', data: updatedManufacturer });
        }
        catch (error) {
            next(error);
        }
    }
    // Toggle manufacturer status by ID
    async toggleManufacturerStatus(req, res, next) {
        try {
            const { id } = req.params;
            const manufacturer = await Manufacturer.findById(id);
            if (!manufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
            }
            manufacturer.status = manufacturer.status === 'active' ? 'inactive' : 'active';
            await manufacturer.save();
            const message = manufacturer.status === 'active' ? 'Manufacturer Activated' : 'Manufacturer Deactivated';
            res.status(200).json({ success: true, message });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete one manufacturer by ID
    async deleteManufacturerById(req, res, next) {
        try {
            const { id } = req.params;
            const deletedManufacturer = await Manufacturer.findByIdAndDelete(id);
            if (!deletedManufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
                return;
            }
            res.status(200).json({ success: true, message: 'Manufacturer deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete multiple manufacturers by IDs
    async deleteMultipleManufacturers(req, res, next) {
        try {
            const { manufacturerIds } = req.body;
            if (!Array.isArray(manufacturerIds) || manufacturerIds.some((id) => typeof id !== 'string')) {
                res.status(400).json({ success: false, message: 'Invalid manufacturer IDs' });
                return;
            }
            const deleteResult = await Manufacturer.deleteMany({ _id: { $in: manufacturerIds } });
            if (deleteResult.deletedCount > 0) {
                res.status(200).json({ success: true, message: 'Manufacturers deleted successfully' });
            }
            else {
                throw new ErrorResponse(404, 'No manufacturers found for deletion');
            }
        }
        catch (error) {
            next(error);
        }
    }
}
export default new ManufacturerController();
//# sourceMappingURL=manufacturer.controller.js.map