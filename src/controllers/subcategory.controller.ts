import { Request, Response, NextFunction } from 'express';
import Subcategory, { ISubcategory } from '../models/subCategory.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import { ListFormat } from '../utils/ListFormat.js';

class SubcategoryController {
    // Create a new subcategory
    public async createSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;

            req.body['features'] = ListFormat(req.body.features);

            // Extract subcategory information from the request body
            const subcategoryInfo: ISubcategory = req.body;

            // Create the subcategory with the provided information
            const subcategory = await Subcategory.create(subcategoryInfo);

            res.status(201).json({ success: true, message: 'Subcategory created successfully.', data: subcategory });
        } catch (error) {
            // Handle any errors that may occur during subcategory creation
            next(error);
        }
    }

    // Method for retrieving all subcategories with pagination, sorting, and searching by name
    public async getAllSubcategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Define pagination parameters
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;

            // Define sorting options
            const sortBy: string = (req.query.sortBy as string) || 'title';
            const sortOrder: 'asc' | 'desc' = ((req.query.sortOrder as string) || 'asc') === 'desc' ? 'desc' : 'asc';

            // Define search criteria
            const titleQuery: string = (req.query.title as string) || '';

            // Build the filter object based on search criteria
            const filter: Record<string, any> = {};

            if (titleQuery) {
                filter['title'] = { $regex: new RegExp(titleQuery, 'i') };
            }

            // Calculate skip value for pagination
            const skip: number = (page - 1) * limit;

            // Define sort object for MongoDB
            const sort: { [key: string]: 'asc' | 'desc' } = {};
            sort[sortBy] = sortOrder;

            // Query the database with pagination, sorting, and filtering
            const subcategories = await Subcategory.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('parent_category_id', 'title'); // Populate category title by parent_category_id

            // Calculate the total count of matching subcategories (for pagination)
            const totalCount = await Subcategory.countDocuments(filter);

            // Respond with the paginated and sorted subcategories
            res.status(200).json({
                success: true,
                data: subcategories,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            });
        } catch (error) {
            // Handle any errors that may occur during subcategory retrieval
            next(error);
        }
    }

    // Get all subcategories name id
    public async getIdAndName(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Provide the fields to select as an object
            const subcategories = await Subcategory.find().where({ status: 'show' }).select({ id: 1, title: 1 });

            res.status(200).json({ success: true, data: subcategories });
        } catch (error) {
            next(error);
        }
    }

    // Toggle category status by ID
    public async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const subCategory = await Subcategory.findById(id);

            if (!subCategory) {
                throw new Error('Category not found');
            }

            subCategory.status = subCategory.status === 'show' ? 'hide' : 'show';
            await subCategory.save();

            let message = subCategory.status === 'show' ? 'Sub Category Published' : 'Sub Category Un-Published'

            res.status(200).json({ success: true, message: `${message}` });
        } catch (error) {
            next(error);
        }
    }

    // Update a subcategory by ID
    public async updateSubcategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            req.body['features'] = ListFormat(req.body.features);

            const updatedSubcategoryInfo: ISubcategory = req.body;
            const updatedSubcategory = await Subcategory.findByIdAndUpdate(id, updatedSubcategoryInfo, { new: true });

            if (!updatedSubcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            res.status(200).json({ success: true, message: 'Subcategory updated!', data: updatedSubcategory });
        } catch (error) {
            next(error);
        }
    }

    // Delete a subcategory by ID
    public async deleteSubcategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const deletedSubcategory = await Subcategory.findByIdAndDelete(id);

            if (!deletedSubcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            res.status(200).json({ success: true, message: 'Subcategory deleted successfully.' });
        } catch (error) {
            next(error);
        }
    }

    // Delete multiple sub categories by IDs
    public async deleteMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { subcategoryIds } = req.body; // Assuming subcategoryIds is an array of category IDs

            // Validate that subcategoryIds is an array of strings
            if (!Array.isArray(subcategoryIds) || subcategoryIds.some((id) => typeof id !== 'string')) {
                res.status(400).json({ success: false, message: 'Invalid sub category IDs' });
                return;
            }

            // Use the $in operator to delete categories with matching IDs
            const deleteResult = await Subcategory.deleteMany({ _id: { $in: subcategoryIds } });

            if (deleteResult.deletedCount > 0) {
                res.status(200).json({ success: true, message: 'Sub Categories deleted successfully' });
            } else {
                throw new ErrorResponse(404, 'No sub categories found for deletion');
            }
        } catch (error) {
            next(error);
        }
    }

    // Add features to a subcategory by ID
    public async addFeaturesToSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { features } = req.body;

            const subcategory = await Subcategory.findById(id);

            if (!subcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            subcategory.features.push(...features);

            const updatedSubcategory = await subcategory.save();

            res.status(200).json({ success: true, message: 'Features added to subcategory', data: updatedSubcategory });
        } catch (error) {
            next(error);
        }
    }

    // Remove features from a subcategory by ID
    public async removeFeaturesFromSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { features } = req.body;

            const subcategory = await Subcategory.findById(id);

            if (!subcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            subcategory.features = subcategory.features.filter((feature: string) => !features.includes(feature));

            const updatedSubcategory = await subcategory.save();

            res.status(200).json({ success: true, message: 'Features removed from subcategory', data: updatedSubcategory });
        } catch (error) {
            next(error);
        }
    }
}

export default new SubcategoryController();
