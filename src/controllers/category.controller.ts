import { Request, Response, NextFunction } from 'express';
import Category, { ICategory } from '../models/category.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import csvParser from 'csv-parser';
import fs from 'fs';

class CategoryController {
    // Create a new category with an optional icon
    public async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;

            // Extract category information from the request body
            const categoryInfo: ICategory = req.body;

            // Create the category with the provided information (including optional icon)
            const category = await Category.create(categoryInfo);

            res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
        } catch (error) {
            // Handle any errors that may occur during category creation or image upload
            next(error);
        }
    }

    // Get all categories
    public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await Category.find();

            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    // Get all categories
    public async getIdAndName(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Provide the fields to select as an object
            const categories = await Category.find().where({ status: 'show' }).select({ id: 1, title: 1 });

            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    // Method for retrieving all categories with pagination, sorting, and searching by name
    public async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
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
            const categories = await Category.find(filter).where({ user_id: req.account?._id }).sort(sort).skip(skip).limit(limit);

            // Calculate the total count of matching categories (for pagination)
            const totalCount = await Category.countDocuments(filter);

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
        } catch (error) {
            // Handle any errors that may occur during category retrieval
            next(error);
        }
    }

    // Get a category by ID
    public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);

            if (!category) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }

            res.status(200).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    }

    // Update a category by ID
    public async updateById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const updatedCategoryInfo: ICategory = req.body;
            const updatedCategory = await Category.findByIdAndUpdate(id, updatedCategoryInfo, { new: true });

            if (!updatedCategory) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }

            res.status(200).json({ success: true, message: 'Category updated!', data: updatedCategory });
        } catch (error) {
            next(error);
        }
    }

    // Update all categories by their IDs
    public async updateAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract the list of category IDs from the request body
            const categoryIdsToUpdate: string[] = req.body;

            // Create an array of promises for updating categories
            const updatePromises = categoryIdsToUpdate.map(async (categoryId: string) => {
                // Find the category by its ID
                const categoryToUpdate = await Category.findById(categoryId);

                if (!categoryToUpdate) {
                    // If the category is not found, you can handle it accordingly, e.g., log an error
                    return null; // Skip this category if not found
                }
                // Save the updated category
                const updatedCategory = await categoryToUpdate.save();
                return updatedCategory;
            });

            // Wait for all update promises to resolve
            const updatedCategoriesResult = await Promise.all(updatePromises);

            // Filter out null values (categories not found) and get the updated categories
            const updatedCategories = updatedCategoriesResult.filter(category => category !== null);

            res.status(200).json({ success: true, data: updatedCategories, message: 'Categories updated successfully.' });
        } catch (error) {
            next(error);
        }
    }

    // Toggle category status by ID
    public async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const category = await Category.findById(id);

            if (!category) {
                throw new Error('Category not found');
            }

            category.status = category.status === 'show' ? 'hide' : 'show';
            await category.save();

            let message = category.status === 'show' ? 'Category Published' : 'Category Un-Published'

            res.status(200).json({ success: true, message: `${message}` });
        } catch (error) {
            next(error);
        }
    }

    // Toggle status of multiple categories based on the provided status (show/hide)
    public async multiToggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status } = req.query; // Get the status from query parameters
            const { ids } = req.body; // Get an array of IDs from the request body

            // Check if the status is valid ('show' or 'hide')
            if (status !== 'show' && status !== 'hide') {
                throw new ErrorResponse(400, 'Invalid status. It must be "show" or "hide".');
            }

            // Find and update the documents with the specified IDs
            const updateResult = (await Category.updateMany(
                { _id: { $in: ids } }, // Find documents with matching IDs
                { $set: { status } } // Update the status field
            )) as any;

            if (updateResult.n === 0) {
                throw new ErrorResponse(404, 'No categories were updated. Check if the IDs are valid.');
            }

            res.status(200).json({ success: true, message: `Categories updated to ${status}` });
        } catch (error) {
            next(error);
        }
    }

    // Delete one category by ID
    public async deleteOne(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const deletedCategory = await Category.findByIdAndDelete(id);

            if (!deletedCategory) {
                throw new Error('Category not found');
            }

            res.status(200).json({ success: true, message: 'Category deleted successfully.' });
        } catch (error) {
            next(error);
        }
    }

    // Delete multiple categories by IDs
    public async deleteMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { categoryIds } = req.body; // Assuming categoryIds is an array of category IDs

            // Validate that categoryIds is an array of strings
            if (!Array.isArray(categoryIds) || categoryIds.some((id) => typeof id !== 'string')) {
                res.status(400).json({ success: false, message: 'Invalid category IDs' });
                return;
            }

            // Use the $in operator to delete categories with matching IDs
            const deleteResult = await Category.deleteMany({ _id: { $in: categoryIds } });

            if (deleteResult.deletedCount > 0) {
                res.status(200).json({ success: true, message: 'Categories deleted successfully' });
            } else {
                throw new ErrorResponse(404, 'No categories found for deletion');
            }
        } catch (error) {
            next(error);
        }
    }

    // Controller for creating categories from JSON or CSV file
    public async createCategoriesFromJsonOrCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { file } = req;

            if (!file) {
                throw new ErrorResponse(400, 'No file uploaded.');
            }

            const records: ICategory[] = [];

            if (file.mimetype === 'application/json') {
                // Handle JSON file
                const jsonData: ICategory[] = JSON.parse(fs.readFileSync(file.path, 'utf-8'));

                // Ensure the structure of jsonData matches ICategory
                if (!Array.isArray(jsonData)) {
                    throw new ErrorResponse(400, 'JSON data must be an array of objects.');
                }

                records.push(...jsonData);
            } else if (file.mimetype === 'text/csv') {
                // Handle CSV file
                fs.createReadStream(file.path)
                    .pipe(csvParser())
                    .on('data', (row: any) => {
                        // Map CSV data to your model structure
                        const category: any = {
                            title: row.title,
                            description: row.description,
                            status: row.status
                        };
                        records.push(category);
                    });
            } else {
                throw new ErrorResponse(400, 'Unsupported file type.');
            }

            // Insert records into the MongoDB collection
            const result = await Category.insertMany(records);

            // Respond with the result
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new CategoryController();
