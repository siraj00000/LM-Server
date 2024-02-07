import Company from '../models/company.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import csvParser from 'csv-parser';
import fs from 'fs';
class CompanyController {
    // Create a new company
    async createCompany(req, res, next) {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;
            if (typeof req.body['sub_category'] === 'string') {
                req.body['sub_category'] = req.body['sub_category'].split(",");
            }
            // Extract company information from the request body
            const companyInfo = req.body;
            // Create the company with the provided information
            const company = await Company.create(companyInfo);
            res.status(201).json({ success: true, message: 'Company created successfully.', data: company });
        }
        catch (error) {
            // Handle any errors that may occur during company creation
            next(error);
        }
    }
    // Get all companies
    async getAll(req, res, next) {
        try {
            const companies = await Company.find();
            res.status(200).json({ success: true, data: companies });
        }
        catch (error) {
            next(error);
        }
    }
    // Get a company by ID
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const company = await Company.findById(id);
            if (!company) {
                res.status(404).json({ success: false, message: 'Company not found' });
                return;
            }
            res.status(200).json({ success: true, data: company });
        }
        catch (error) {
            next(error);
        }
    }
    // Method for retrieving all companies with pagination, sorting, and searching by name
    async getAllCompanies(req, res, next) {
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
            const companies = await Company.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                path: 'sub_category', select: 'title', model: 'Subcategory'
            });
            // Calculate the total count of matching companies (for pagination)
            const totalCount = await Company.countDocuments(filter);
            // Respond with the paginated and sorted companies
            res.status(200).json({
                success: true,
                data: companies,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            });
        }
        catch (error) {
            console.log(error);
            // Handle any errors that may occur during company retrieval
            next(error);
        }
    }
    // Get all companies' ID and name
    async getIdAndName(req, res, next) {
        try {
            // Provide the fields to select as an object
            const companies = await Company.find().where({ status: 'show' }).select({ _id: 1, name: 1 });
            res.status(200).json({ success: true, data: companies });
        }
        catch (error) {
            next(error);
        }
    }
    // Toggle company status by ID
    async toggleStatus(req, res, next) {
        try {
            const { id } = req.params;
            const company = await Company.findById(id);
            if (!company) {
                throw new Error('Company not found');
            }
            company.status = company.status === 'show' ? 'hide' : 'show';
            await company.save();
            const statusMessage = company.status === 'show' ? 'Company Published' : 'Company Unpublished';
            res.status(200).json({ success: true, message: statusMessage });
        }
        catch (error) {
            next(error);
        }
    }
    // Update a company by ID
    async updateById(req, res, next) {
        try {
            const { id } = req.params;
            if (typeof req.body['sub_category'] === 'string') {
                req.body['sub_category'] = req.body['sub_category'].split(",");
            }
            const updatedCompanyInfo = req.body;
            const updatedCompany = await Company.findByIdAndUpdate(id, updatedCompanyInfo, { new: true });
            if (!updatedCompany) {
                res.status(404).json({ success: false, message: 'Company not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Company updated!', data: updatedCompany });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete one company by ID
    async deleteOne(req, res, next) {
        try {
            const { id } = req.params;
            const deletedCompany = await Company.findByIdAndDelete(id);
            if (!deletedCompany) {
                throw new Error('Company not found');
            }
            res.status(200).json({ success: true, message: 'Company deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete multiple companies by IDs
    async deleteMultiple(req, res, next) {
        try {
            const { companyIds } = req.body;
            // Validate that companyIds is an array of strings
            if (!Array.isArray(companyIds) || companyIds.some((id) => typeof id !== 'string')) {
                res.status(400).json({ success: false, message: 'Invalid company IDs' });
                return;
            }
            // Use the $in operator to delete companies with matching IDs
            const deleteResult = await Company.deleteMany({ _id: { $in: companyIds } });
            if (deleteResult.deletedCount > 0) {
                res.status(200).json({ success: true, message: 'Companies deleted successfully' });
            }
            else {
                throw new ErrorResponse(404, 'No companies found for deletion');
            }
        }
        catch (error) {
            next(error);
        }
    }
    // Controller for creating companies from JSON or CSV file
    async createCompaniesFromJsonOrCsv(req, res, next) {
        try {
            const { file } = req;
            if (!file) {
                throw new ErrorResponse(400, 'No file uploaded.');
            }
            const records = [];
            if (file.mimetype === 'application/json') {
                // Handle JSON file
                const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
                // Ensure the structure of jsonData matches ICompany
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
                    const company = {
                        email: row.email,
                        name: row.name,
                        pincode: row.pincode,
                        registered_address: row.registered_address,
                        phone_one: row.phone_one,
                        phone_two: row.phone_two,
                        status: row.status,
                        estaiblishment_year: row.estaiblishment_year,
                        sub_category: row.sub_category?.split(',').map((category) => category.trim()) || null
                    };
                    records.push(company);
                });
            }
            else {
                throw new ErrorResponse(400, 'Unsupported file type.');
            }
            // Insert records into the MongoDB collection
            const result = await Company.insertMany(records);
            // Respond with the result
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
export default new CompanyController();
//# sourceMappingURL=company.controller.js.map