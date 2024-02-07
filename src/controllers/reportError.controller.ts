import { NextFunction, Request, Response } from "express";
import ErrorReport, { IErrorReport } from "../models/reportError.model.js";
import Brand from "../models/brand.model.js";
import { ErrorResponse } from "../utils/error_response.utils.js";
import mongoose from "mongoose";

class ReportErrorController {
    public async reportError(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const errorReportInfo: IErrorReport = req.body
            const brand = await Brand.findById(errorReportInfo.brand_id).select("company_id") as any;

            if (!brand) throw new ErrorResponse(400, "Invalid Brand");

            errorReportInfo.company_id = brand.company_id;

            await ErrorReport.create(errorReportInfo);

            res.status(201).json({
                success: true,
                message: "Error report registered!"
            })
        } catch (error) {
            next(error);
        }
    }

    public async getErrorReports(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Define pagination parameters
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;

            // Define sorting options
            const sortBy: string = (req.query.sortBy as string) || 'purchase_date';
            const sortOrder: 'asc' | 'desc' = ((req.query.sortOrder as string) || 'asc') === 'desc' ? 'desc' : 'asc';

            // Define search criteria
            const purchaseDateQuery: string = (req.query.purchase_date as string) || '';

            // Build the filter object based on search criteria
            const filter: Record<string, any> = {};

            if (purchaseDateQuery) {
                filter['purchase_date'] = { $regex: new RegExp(purchaseDateQuery, 'i') };
            }

            // Calculate skip value for pagination
            const skip: number = (page - 1) * limit;

            // Define sort object for MongoDB
            const sort: { [key: string]: 'asc' | 'desc' } = {};
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
        } catch (error) {
            // Handle any errors that may occur during category retrieval
            next(error);
        }
    }
}

export default new ReportErrorController();