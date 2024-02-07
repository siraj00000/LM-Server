import { Request, Response, NextFunction } from 'express';
import Manufacturer, { IManufacturer } from '../models/manufacturer.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';

class ManufacturerController {
    // Create a new manufacturer
    public async createManufacturer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;
            const manufacturerInfo: IManufacturer = req.body;
            await Manufacturer.create(manufacturerInfo);
            res.status(201).json({ success: true, message: 'Manufacturer created successfully.' });
        } catch (error) {
            next(error);
        }
    }

    // Method for retrieving all manufacturers with pagination, sorting, and searching by name
    public async getAllManufacturers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Define pagination parameters
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;

            // Define sorting options
            const sortBy: string = (req.query.sortBy as string) || 'name';
            const sortOrder: 'asc' | 'desc' = ((req.query.sortOrder as string) || 'asc') === 'desc' ? 'desc' : 'asc';

            // Define search criteria
            const nameQuery: string = (req.query.name as string) || '';

            // Build the filter object based on search criteria
            const filter: Record<string, any> = {};

            if (nameQuery) {
                filter['name'] = { $regex: new RegExp(nameQuery, 'i') };
            }

            // Calculate skip value for pagination
            const skip: number = (page - 1) * limit;

            // Define sort object for MongoDB
            const sort: { [key: string]: 'asc' | 'desc' } = {};
            sort[sortBy] = sortOrder;

            // Query the database with pagination, sorting, and filtering
            const manufacturers = await Manufacturer.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'company_id',
                    select: 'name', // Select only the 'name' field from the 'company_id' document
                    model: 'Company' // Assuming 'Company' is the name of the related model
                });

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

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
        } catch (error) {
            // Handle any errors that may occur during manufacturer retrieval
            next(error);
        }
    }

    // Get all manufacturers' ID and name
    public async getIdAndName(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const manufacturers = await Manufacturer.find().where({ status: 'active' }).select({ _id: 1, name: 1 });
            res.status(200).json({ success: true, data: manufacturers });
        } catch (error) {
            next(error);
        }
    }

    // Get manufacturer by ID
    public async getManufacturerById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const manufacturer = await Manufacturer.findById(id);
            if (!manufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
            }
            res.status(200).json({ success: true, data: manufacturer });
        } catch (error) {
            next(error);
        }
    }

    // Update manufacturer by ID
    public async updateManufacturerById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const updatedManufacturerInfo: IManufacturer = req.body;
            const updatedManufacturer = await Manufacturer.findByIdAndUpdate(id, updatedManufacturerInfo, { new: true });
            if (!updatedManufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
            }
            res.status(200).json({ success: true, message: 'Manufacturer updated!', data: updatedManufacturer });
        } catch (error) {
            next(error);
        }
    }

    // Toggle manufacturer status by ID
    public async toggleManufacturerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        } catch (error) {
            next(error);
        }
    }

    // Delete one manufacturer by ID
    public async deleteManufacturerById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const deletedManufacturer = await Manufacturer.findByIdAndDelete(id);
            if (!deletedManufacturer) {
                throw new ErrorResponse(404, 'Manufacturer not found');
                return;
            }
            res.status(200).json({ success: true, message: 'Manufacturer deleted successfully.' });
        } catch (error) {
            next(error);
        }
    }

    // Delete multiple manufacturers by IDs
    public async deleteMultipleManufacturers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { manufacturerIds } = req.body;
            if (!Array.isArray(manufacturerIds) || manufacturerIds.some((id) => typeof id !== 'string')) {
                res.status(400).json({ success: false, message: 'Invalid manufacturer IDs' });
                return;
            }
            const deleteResult = await Manufacturer.deleteMany({ _id: { $in: manufacturerIds } });
            if (deleteResult.deletedCount > 0) {
                res.status(200).json({ success: true, message: 'Manufacturers deleted successfully' });
            } else {
                throw new ErrorResponse(404, 'No manufacturers found for deletion');
            }
        } catch (error) {
            next(error);
        }
    }
}

export default new ManufacturerController();
