import { NextFunction, Request, Response } from 'express';
import RequestHelpOnLabel, { IRequestHelpOnLabel } from '../models/requestHelpOnLabel.model.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import Label from '../models/label.model.js';

class RequestHelpOnLabelController {
    public async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { DS1, request_date, help_ref_num, address, pincode } = req.body;

            const label: any = await Label.findOne({ DS1: { $in: DS1 } })
                .select('brand_id product_id')
                .populate({
                    path: "brand_id",
                    select: "company_id",
                    model: "Brand"
                })

            const body = {
                DS1,
                brand_id: label?.brand_id._id,
                product_id: label.product_id,
                company_id: label?.brand_id.company_id,
                request_date,
                help_ref_num,
                address,
                pincode
            }

            await RequestHelpOnLabel.create(body);

            res.status(201).json({
                success: true,
                message: "Help request posted",
            });
        } catch (error) {
            next(error);
        }
    }

    public async updateAddressAndPincode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { requestId } = req.params;
            const { address, pincode } = req.body;

            const updatedRequest: IRequestHelpOnLabel | null = await RequestHelpOnLabel.findByIdAndUpdate(
                requestId,
                { address, pincode },
                { new: true }
            );

            if (updatedRequest) {
                res.status(202).json({ success: true, message: "Updated Successfully" });
            } else {
                throw new ErrorResponse(404, "Request not found");
            }
        } catch (error) {
            next(error);
        }
    }

    public async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Define pagination parameters
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;

            // Define sorting options
            const sortBy: string = (req.query.sortBy as string) || 'store_name';
            const sortOrder: 'asc' | 'desc' = ((req.query.sortOrder as string) || 'asc') === 'desc' ? 'desc' : 'asc';

            // Define search criteria
            const storeNameQuery: string = (req.query.store_name as string) || '';

            // Build the filter object based on search criteria
            const filter: Record<string, any> = {};

            if (storeNameQuery) {
                filter['store_name'] = { $regex: new RegExp(storeNameQuery, 'i') };
            }

            // Calculate skip value for pagination
            const skip: number = (page - 1) * limit;

            // Define sort object for MongoDB
            const sort: { [key: string]: 'asc' | 'desc' } = {};
            sort[sortBy] = sortOrder;

            // Query the database with pagination, sorting, and filtering
            const requests: IRequestHelpOnLabel[] = await RequestHelpOnLabel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            // Calculate the total count of matching requests (for pagination)
            const totalCount: number = await RequestHelpOnLabel.countDocuments(filter);

            // Respond with the paginated and sorted requests
            res.status(200).json({
                success: true,
                data: requests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit,
                },
            });
        } catch (error) {
            // Handle any errors that may occur during request retrieval
            next(error);
        }
    }

    public async getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { requestId } = req.params;

            const request: IRequestHelpOnLabel | null = await RequestHelpOnLabel.findById(requestId);

            if (request) {
                res.json(request);
            } else {
                res.status(404).json({ error: 'Request not found' });
            }
        } catch (error) {
            next(error);
        }
    }
}

export default new RequestHelpOnLabelController();
