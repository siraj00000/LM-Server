import { Request, Response, NextFunction } from 'express';
import Company, { ICompany } from '../models/company.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import csvParser from 'csv-parser';
import fs from 'fs';

class CompanyController {
    // Create a new company
    public async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;

            if (typeof req.body['sub_category'] === 'string') {
                req.body['sub_category'] = req.body['sub_category'].split(",")
            }

            // Extract company information from the request body
            const companyInfo: ICompany = req.body;

            // Create the company with the provided information
            const company = await Company.create(companyInfo);

            res.status(201).json({ success: true, message: 'Company created successfully.', data: company });
        } catch (error) {
            // Handle any errors that may occur during company creation
            next(error);
        }
    }

    // Get all companies
    public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companies = await Company.find();

            res.status(200).json({ success: true, data: companies });
        } catch (error) {
            next(error);
        }
    }

    // Get a company by ID
    public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const company = await Company.findById(id);

            if (!company) {
                res.status(404).json({ success: false, message: 'Company not found' });
                return;
            }

            res.status(200).json({ success: true, data: company });
        } catch (error) {
            next(error);
        }
    }

    // Method for retrieving all companies with pagination, sorting, and searching by name
    public async getAllCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
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
            const companies = await Company.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'sub_category', select: 'title', model: 'Subcategory'
                })

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
        } catch (error) {
            console.log(error);

            // Handle any errors that may occur during company retrieval
            next(error);
        }
    }

    // Get all companies' ID and name
    public async getIdAndName(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Provide the fields to select as an object
            const companies = await Company.find().where({ status: 'show' }).select({ _id: 1, name: 1 });

            res.status(200).json({ success: true, data: companies });
        } catch (error) {
            next(error);
        }
    }

    // Toggle company status by ID
    public async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        } catch (error) {
            next(error);
        }
    }

    // Update a company by ID
    public async updateById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (typeof req.body['sub_category'] === 'string') {
                req.body['sub_category'] = req.body['sub_category'].split(",")
            }

            const updatedCompanyInfo: ICompany = req.body;
            const updatedCompany = await Company.findByIdAndUpdate(id, updatedCompanyInfo, { new: true });

            if (!updatedCompany) {
                res.status(404).json({ success: false, message: 'Company not found' });
                return;
            }

            res.status(200).json({ success: true, message: 'Company updated!', data: updatedCompany });
        } catch (error) {
            next(error);
        }
    }

    // Delete one company by ID
    public async deleteOne(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const deletedCompany = await Company.findByIdAndDelete(id);

            if (!deletedCompany) {
                throw new Error('Company not found');
            }

            res.status(200).json({ success: true, message: 'Company deleted successfully.' });
        } catch (error) {
            next(error);
        }
    }

    // Delete multiple companies by IDs
    public async deleteMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
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
            } else {
                throw new ErrorResponse(404, 'No companies found for deletion');
            }
        } catch (error) {
            next(error);
        }
    }

    // Controller for creating companies from JSON or CSV file
    public async createCompaniesFromJsonOrCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { file } = req;

            if (!file) {
                throw new ErrorResponse(400, 'No file uploaded.');
            }

            const records: ICompany[] = [];

            if (file.mimetype === 'application/json') {
                // Handle JSON file
                const jsonData: ICompany[] = JSON.parse(fs.readFileSync(file.path, 'utf-8'));

                // Ensure the structure of jsonData matches ICompany
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
                        const company: any = {
                            email: row.email,
                            name: row.name,
                            pincode: row.pincode,
                            registered_address: row.registered_address,
                            phone_one: row.phone_one,
                            phone_two: row.phone_two,
                            status: row.status,
                            estaiblishment_year: row.estaiblishment_year,
                            sub_category: row.sub_category?.split(',').map((category: string) => category.trim()) || null
                        };
                        records.push(company);
                    });
            } else {
                throw new ErrorResponse(400, 'Unsupported file type.');
            }

            // Insert records into the MongoDB collection
            const result = await Company.insertMany(records);

            // Respond with the result
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new CompanyController();
