import Category from '../models/category.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import csvParser from 'csv-parser';
import fs from 'fs';
class CategoryController {
    // Create a new category with an optional icon
    async createCategory(req, res, next) {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;
            // Extract category information from the request body
            const categoryInfo = req.body;
            // Create the category with the provided information (including optional icon)
            const category = await Category.create(categoryInfo);
            res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
        }
        catch (error) {
            // Handle any errors that may occur during category creation or image upload
            next(error);
        }
    }
    // Get all categories
    async getAll(req, res, next) {
        try {
            const categories = await Category.find();
            res.status(200).json({ success: true, data: categories });
        }
        catch (error) {
            next(error);
        }
    }
    // Get all categories
    async getIdAndName(req, res, next) {
        try {
            // Provide the fields to select as an object
            const categories = await Category.find().where({ status: 'show' }).select({ id: 1, title: 1 });
            res.status(200).json({ success: true, data: categories });
        }
        catch (error) {
            next(error);
        }
    }
    // Method for retrieving all categories with pagination, sorting, and searching by name
    async getAllCategories(req, res, next) {
        try {
            // Define pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Define sorting options
            const sortBy = req.query.sortBy || 'title';
            const sortOrder = (req.query.sortOrder || 'asc') === 'desc' ? 'desc' : 'asc';
            // Define search criteria
            const titleQuery = req.query.title || '';
            // Build the filter object based on search criteria
            const filter = {};
            if (titleQuery) {
                filter['title'] = { $regex: new RegExp(titleQuery, 'i') };
            }
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            // Define sort object for MongoDB
            const sort = {};
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
        }
        catch (error) {
            // Handle any errors that may occur during category retrieval
            next(error);
        }
    }
    // Get a category by ID
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            if (!category) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }
            res.status(200).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    }
    // Update a category by ID
    async updateById(req, res, next) {
        try {
            const { id } = req.params;
            const updatedCategoryInfo = req.body;
            const updatedCategory = await Category.findByIdAndUpdate(id, updatedCategoryInfo, { new: true });
            if (!updatedCategory) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Category updated!', data: updatedCategory });
        }
        catch (error) {
            next(error);
        }
    }
    // Update all categories by their IDs
    async updateAll(req, res, next) {
        try {
            // Extract the list of category IDs from the request body
            const categoryIdsToUpdate = req.body;
            // Create an array of promises for updating categories
            const updatePromises = categoryIdsToUpdate.map(async (categoryId) => {
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
        }
        catch (error) {
            next(error);
        }
    }
    // Toggle category status by ID
    async toggleStatus(req, res, next) {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            if (!category) {
                throw new Error('Category not found');
            }
            category.status = category.status === 'show' ? 'hide' : 'show';
            await category.save();
            let message = category.status === 'show' ? 'Category Published' : 'Category Un-Published';
            res.status(200).json({ success: true, message: `${message}` });
        }
        catch (error) {
            next(error);
        }
    }
    // Toggle status of multiple categories based on the provided status (show/hide)
    async multiToggleStatus(req, res, next) {
        try {
            const { status } = req.query; // Get the status from query parameters
            const { ids } = req.body; // Get an array of IDs from the request body
            // Check if the status is valid ('show' or 'hide')
            if (status !== 'show' && status !== 'hide') {
                throw new ErrorResponse(400, 'Invalid status. It must be "show" or "hide".');
            }
            // Find and update the documents with the specified IDs
            const updateResult = (await Category.updateMany({ _id: { $in: ids } }, // Find documents with matching IDs
            { $set: { status } } // Update the status field
            ));
            if (updateResult.n === 0) {
                throw new ErrorResponse(404, 'No categories were updated. Check if the IDs are valid.');
            }
            res.status(200).json({ success: true, message: `Categories updated to ${status}` });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete one category by ID
    async deleteOne(req, res, next) {
        try {
            const { id } = req.params;
            const deletedCategory = await Category.findByIdAndDelete(id);
            if (!deletedCategory) {
                throw new Error('Category not found');
            }
            res.status(200).json({ success: true, message: 'Category deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete multiple categories by IDs
    async deleteMultiple(req, res, next) {
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
            }
            else {
                throw new ErrorResponse(404, 'No categories found for deletion');
            }
        }
        catch (error) {
            next(error);
        }
    }
    // Controller for creating categories from JSON or CSV file
    async createCategoriesFromJsonOrCsv(req, res, next) {
        try {
            const { file } = req;
            if (!file) {
                throw new ErrorResponse(400, 'No file uploaded.');
            }
            const records = [];
            if (file.mimetype === 'application/json') {
                // Handle JSON file
                const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
                // Ensure the structure of jsonData matches ICategory
                if (!Array.isArray(jsonData)) {
                    throw new ErrorResponse(400, 'JSON data must be an array of objects.');
                }
                records.push(...jsonData);
            }
            else if (file.mimetype === 'text/csv') {
                // Handle CSV file
                fs.createReadStream(file.path)
                    .pipe(csvParser())
                    .on('data', (row) => {
                    // Map CSV data to your model structure
                    const category = {
                        title: row.title,
                        description: row.description,
                        status: row.status
                    };
                    records.push(category);
                });
            }
            else {
                throw new ErrorResponse(400, 'Unsupported file type.');
            }
            // Insert records into the MongoDB collection
            const result = await Category.insertMany(records);
            // Respond with the result
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
export default new CategoryController();
//# sourceMappingURL=category.controller.js.map