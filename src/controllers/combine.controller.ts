import { NextFunction, Request, Response } from "express";
import Brand from "../models/brand.model.js";
import Company from "../models/company.model.js";
import Manufacturer from "../models/manufacturer.model.js";
import Account from "../models/accounts.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import Label, { ILabel } from "../models/label.model.js";
import { ErrorResponse } from "../utils/error_response.utils.js";
import getDates, { getCustomDateRange } from "../utils/dateFormat.js";
import csv from 'fast-csv';
import fs from 'fs';
import Warranty from "../models/warranty.model.js";
import RequestHelpOnLabel from "../models/requestHelpOnLabel.model.js";
import ErrorReport from "../models/reportError.model.js";

class CombineController {
    // Fetch Brands & Select Id and Name or Title.
    public async fetchCompanyBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Fetch active status brands
            const activeBrands = await Brand.find({ status: 'show', company_id: req.account?.associatedId }).select('name warranty request_help');
            console.log(activeBrands);

            res.status(200).json({ success: true, data: activeBrands });
        } catch (error) {
            next(error);
        }
    }

    // Fetch Subcategories & Select Id and Name or Title.
    public async fetchCompanySubcategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const getUserCompanySubcategory = await Company.findById(req.account?.associatedId).populate({
                path: "sub_category",
                select: "title features",
                model: "Subcategory"
            })

            res.status(200).json({ success: true, data: getUserCompanySubcategory?.sub_category });
        } catch (error) {
            next(error);
        }
    }

    public async fetchBrandForAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { level, company_ids } = req.body;
            const filter: Record<string, any> = {
                status: "show"
            };

            if (level === 1 && company_ids.length > 0) {
                filter.company_id = { $in: company_ids }
            } else if (level === 2) {
                filter.company_id = req.account?.associatedId
            }

            const brands = await Brand.find(filter).select('name')
            res.status(200).json({
                success: true,
                data: brands
            })
        } catch (error) {
            next(error);
        }
    }

    // Fetch Manufacture's company Brands & Select Id and Name or Title.
    public async fetchManufacturerBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const associatedId = req.account?.associatedId;

            const activeBrands = await Brand.aggregate([
                {
                    $match: {
                        status: 'show'
                    }
                },
                {
                    $lookup: {
                        from: 'manufacturers',
                        localField: 'company_id',
                        foreignField: 'company_id',
                        as: 'manufacturer'
                    }
                },
                {
                    $unwind: '$manufacturer'
                },
                {
                    $match: {
                        'manufacturer._id': associatedId
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1
                    }
                }
            ]);

            res.status(200).json({ success: true, data: activeBrands });
        } catch (error) {
            next(error);
        }
    }

    public async fetchManufacturerBrandProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const associatedId = req.account?.associatedId;
            const company = await Manufacturer.findById(associatedId);
            let matchQuery: any = {
                status: 'show',
                company_id: company?.company_id
            };

            console.log(associatedId, company?.company_id, req.body.brand_id);


            // Check if brand_id exists in the request body
            if (req.body.brand_id) {
                matchQuery.brand_id = req.body.brand_id;
            }

            const activeProducts = await Product.find(matchQuery).select('name feature variants')

            res.status(200).json({ success: true, data: activeProducts });
        } catch (error) {
            next(error);
        }
    }

    // public async fetchManufacturerBrandProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         const products = await Product.find();
    //         res.send(200).json({
    //             success: true,
    //             data: products
    //         })
    //     } catch (error) {
    //         next(error);
    //     }

    //     // try {
    //     //     const associatedId = req.account?.associatedId;
    //     //     const manufacture = await Manufacturer.findById(associatedId).select('company_id');
    //     //     const brandId = req.body.brand_id;
    //     //     console.log(req.body);

    //     //     const matchStage: any = {
    //     //         status: 'show',
    //     //         company_id: manufacture?.company_id
    //     //     };

    //     //     if (brandId) {
    //     //         matchStage.brand_id = new mongoose.Types.ObjectId(brandId); // Convert brandId to ObjectId
    //     //     }

    //     //     console.log(matchStage); // Log the matchStage for debugging

    //     //     const activeProducts = await Product.aggregate([
    //     //         {
    //     //             $match: matchStage
    //     //         },
    //     //         {
    //     //             $project: {
    //     //                 _id: 1,
    //     //                 name: 1,
    //     //                 feature: 1,
    //     //                 variants: 1
    //     //             }
    //     //         }
    //     //     ]);

    //     //     console.log(activeProducts); // Log the retrieved products for debugging

    //     //     res.status(200).json({ success: true, data: activeProducts });
    //     // } catch (error) {
    //     //     next(error);
    //     // }
    // }

    public async fetchMultiManufacturerBrandProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const brandIds = req.body.brand_ids || []; // Default to an empty array if brand_ids is not provided
            const associatedId = req.account?.associatedId;

            const matchStage: any = {
                $match: {
                    status: 'show',
                },
            };

            // Add the brand_id filter if brand_ids are provided
            if (brandIds.length > 0) {
                matchStage.$match.brand_id = {
                    $in: brandIds.map((brandId: string) => new mongoose.Types.ObjectId(brandId)),
                };
            }

            const activeProducts = await Product.aggregate([
                matchStage,
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        feature: 1,
                        variants: 1,
                    },
                },
            ]);

            res.status(200).json({ success: true, data: activeProducts });
        } catch (error) {
            next(error);
        }
    }

    public async fetchAccessibiltyAssociatesCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Fetch active status Companies
            const activeCompanies = await Company.find({ status: 'show' }).select('name');
            // Fetch active status Manufacturers
            const activeManufacturers = await Manufacturer.find({ status: 'active' }).select('name');
            // Fetch active status Accounts
            const accounts = await Account.find({ status: 'active', role: 'Company Admin' || 'Manufacturer' }).select('name role');

            res.status(200).json({ success: true, data: { activeCompanies, activeManufacturers, accounts } });
        } catch (error) {
            next(error);
        }
    }

    public async roleBasedInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            let user = req.account
            res.status(200).json({ user })
        } catch (error) {
            next(error)
        }
    }

    public async fetchCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companies = await Company.find({ user_id: req.account?._id, status: "show" }).find();
            res.status(200).json({
                success: true,
                data: companies
            })
        } catch (error) {
            next(error);
        }
    }

    public async fetchCompaniesManufacturers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { company_ids } = req.body;

            let filter: Record<string, any> = {
                status: "active"
            };

            if (company_ids.length > 0) {
                filter.company_id = { $in: company_ids }
            }

            const manufacturers = await Manufacturer.find(filter);
            res.status(200).json({
                success: true,
                data: manufacturers
            })
        } catch (error) {
            next(error);
        }
    }

    public async superAdminLabelStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract and validate query parameters
            const { date, company_ids, manufacturer_ids, brand_ids, product_ids, variants } = req.body;
            if (typeof date !== 'string') throw new ErrorResponse(400, 'Please provide a valid date');

            // Extracts the start date and end date based on the user-provided date, spanning two months.
            const { startDate, endDate } = getDates(date, 3);

            // Construct filter criteria based on query parameters.
            // Filters records based on creation date falling within the range of 2 months before the start date to the start date.
            const filter: Record<string, any> = {
                createdAt: {
                    $gt: endDate, // Records created after 2 months ago.
                    $lte: startDate // Records created within the last 2 months.
                },
                status: "show"
            };

            if (manufacturer_ids?.length > 0) {
                filter.manufacture_id = { $in: manufacturer_ids }
            } else if (company_ids?.length > 0) {
                const manufacturers = await Manufacturer.find({ company_id: { $in: company_ids }, status: 'show' });
                filter.manufacture_id = { $in: manufacturers.map(manufacturer => manufacturer._id) }
            }

            // Check if brand_ids is an array and not empty
            if (Array.isArray(brand_ids) && brand_ids.length > 0) {
                filter.brand_id = { $in: brand_ids };
            }

            // Check if product_ids is an array and not empty
            if (Array.isArray(product_ids) && product_ids.length > 0) {
                filter.product_id = { $in: product_ids };
            }

            // Check if variants is an array and not empty
            if (Array.isArray(variants) && variants.length > 0) {
                filter.variant = { $in: variants };
            }
            
            // Fetch labels based on the filter criteria and populate the 'user_id' field with user data.
            const labels: ILabel[] = await Label
                .find(filter).populate({
                    path: 'user_id',
                    select: 'name', // Select only the 'name' field from the user document.
                    model: 'Account'
                });

            // Aggregate labels based on unique user_ids and count the labels for each user.
            const userLabelCounts = new Map<string, { name: string, count: number, progress: number }>();

            // Group labels by month and calculate the count for each month
            const monthLabelCounts: Record<string, number> = {};

            // Initialize monthLabelCounts with all months having a count of 0
            const currentDate = new Date(endDate);

            while (currentDate <= startDate) {
                const monthName = currentDate.toLocaleString('en-us', { month: 'short' });
                monthLabelCounts[monthName] = 0;

                // Move to the next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

            labels.forEach(label => {
                const monthYear = label.createdAt.toISOString().slice(0, 7); // Extracts YYYY-MM format from label's creation date
                const monthName = new Date(monthYear + "-01").toLocaleString('en-us', { month: 'short' }); // Converts YYYY-MM to month abbreviation
                monthLabelCounts[monthName] = (monthLabelCounts[monthName] || 0) + 1;

                const userName = getObjectValue(label.user_id, 'name');
                const userLabel = userLabelCounts.get(userName) || { name: userName, count: 0, progress: 0 };
                userLabel.count += 1;
                userLabel.progress = Math.round((userLabel.count / labels.length) * 100);
                userLabelCounts.set(userName, userLabel);
            });

            const [brandsCount, productsCount, adminCount, labelCount] = await Promise.all([
                Brand.find({ status: 'show' }).count(),
                Product.find({ status: 'show' }).count(),
                Account.find({ status: 'active' }).count(),
                Label.find().count()
            ]);

            // Send the response with the calculated data
            res.status(200).json({
                success: true,
                data: {
                    userLabelCounts: Array.from(userLabelCounts.values()),
                    totalLabelsCount: labels.length,
                    monthLabelCounts,
                    stats: {
                        brandsCount,
                        productsCount,
                        adminCount,
                        labelCount
                    }
                },
            });
        } catch (error) {
            console.log(error);

            next(error)
        }
    }

    public async companyLabelStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract and validate query parameters
            const { date } = req.body;
            if (typeof date !== 'string') throw new ErrorResponse(400, 'Please provide a valid date');

            // Extracts the start date and end date based on the user-provided date, spanning two months.
            const { startDate, endDate } = getDates(date, 2);

            // Find manufacturers associated with the given company_id
            const manufacturers = await Manufacturer.find({ company_id: req.account?.associatedId, status: "active" });

            // Extract manufacturer_ids from the found manufacturers
            const manufacturerIds = req.body.manufacture_ids ? req.body.manufacture_ids : manufacturers.map(manufacturer => manufacturer._id);

            // Construct filter criteria based on query parameters.
            // Filters records based on creation date falling within the range of 2 months before the start date to the start date.
            const filter: Record<string, any> = {
                createdAt: {
                    $gt: endDate, // Records created after 2 months ago.
                    $lte: startDate // Records created within the last 2 months.
                },
                manufacture_id: { $in: manufacturerIds }, // Filter labels by found manufacturer_ids
                status: "show"
            };

            // Extracts additional query parameters such as brand ID, product ID, variant, and user ID.
            // If these parameters are provided in the request, they are added to the filter criteria. 
            ["brand_id", "product_id", "variant", "user_id"].forEach((query: string) => {
                if (req.body[query]) filter[query] = req.body[query]; // Adds the specific query parameter to the filter criteria.
            });

            // Fetch labels based on the filter criteria and populate the 'user_id' field with user data.
            const labels: ILabel[] = await Label
                .find(filter).populate({
                    path: 'user_id',
                    select: 'name', // Select only the 'name' field from the user document.
                    model: 'Account'
                });

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }


            // Group labels by month and calculate the count for each month
            const monthLabelCounts: Record<string, number> = {};
            // Aggregate labels based on unique user_ids and count the labels for each user.
            const userLabelCounts = new Map<string, { name: string, count: number, progress: number }>();
            // Initialize monthLabelCounts with all months having a count of 0
            const currentDate = new Date(endDate);

            while (currentDate <= startDate) {
                const monthName = currentDate.toLocaleString('en-us', { month: 'short' });
                monthLabelCounts[monthName] = 0;

                // Move to the next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            labels.forEach(label => {
                const monthYear = label.createdAt.toISOString().slice(0, 7); // Extracts YYYY-MM format from label's creation date
                const monthName = new Date(monthYear + "-01").toLocaleString('en-us', { month: 'short' }); // Converts YYYY-MM to month abbreviation
                monthLabelCounts[monthName] = (monthLabelCounts[monthName] || 0) + 1;

                const userName = getObjectValue(label.user_id, 'name');
                const userLabel = userLabelCounts.get(userName) || { name: userName, count: 0, progress: 0 };
                userLabel.count += 1;
                userLabel.progress = Math.round((userLabel.count / labels.length) * 100);
                userLabelCounts.set(userName, userLabel);
            });

            const [brandsCount, productsCount, adminCount, labelCount] = await Promise.all([
                Brand.find({ company_id: req.account?.associatedId }).count(),
                Product.find({ company_id: req.account?.associatedId }).count(),
                Account.find({ associatedId: req.account?.associatedId }).count(),
                Label.find({ manufacture_id: { $in: manufacturerIds } }).count()
            ]);

            // Send the response with the calculated data
            res.status(200).json({
                success: true,
                data: {
                    userLabelCounts: Array.from(userLabelCounts.values()),
                    totalLabelsCount: labels.length,
                    monthLabelCounts,
                    stats: {
                        brandsCount,
                        productsCount,
                        adminCount,
                        labelCount
                    }
                },
            });
        } catch (error) {
            next(error)
        }
    }

    public async manufacturerLabelStat(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract and validate parameters from the request body
            const { date, brand_ids, product_ids, variants, user_ids } = req.body;
            if (typeof date !== 'string') throw new ErrorResponse(400, 'Please provide a valid date');

            // Extracts the start date and end date based on the user-provided date, spanning two months.
            const { startDate, endDate } = getDates(date, 2);

            // Construct filter criteria based on query parameters.
            // Filters records based on creation date falling within the range of 2 months before the start date to the start date.
            const filter: Record<string, any> = {
                createdAt: {
                    $gt: endDate, // Records created after 2 months ago.
                    $lte: startDate // Records created within the last 2 months.
                },
                status: "show"
            };

            // Add brand IDs, product IDs, variants, and user IDs from the request body to the filter criteria.
            if (Array.isArray(brand_ids)) filter.brand_id = { $in: brand_ids };
            if (Array.isArray(product_ids)) filter.product_id = { $in: product_ids };
            if (Array.isArray(variants)) filter.variant = { $in: variants };
            if (Array.isArray(user_ids)) filter.user_id = { $in: user_ids };


            // Fetch labels based on the filter criteria and populate the 'user_id' field with user data.
            const labels: ILabel[] = await Label
                .where({ manufacture_id: req.account?.associatedId })
                .find(filter).populate({
                    path: 'user_id',
                    select: 'name', // Select only the 'name' field from the user document.
                    model: 'Account'
                });

            // Group labels by month and calculate the count for each month
            const monthLabelCounts: Record<string, number> = {};
            labels.forEach(label => {
                const monthYear = label.createdAt.toISOString().slice(0, 7); // Extracts YYYY-MM format from label's creation date
                const monthName = new Date(monthYear + "-01").toLocaleString('en-us', { month: 'short' }); // Converts YYYY-MM to month abbreviation
                monthLabelCounts[monthName] = (monthLabelCounts[monthName] || 0) + 1;
            });

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

            // Aggregate labels based on unique user_ids and count the labels for each user.
            const userLabelCounts: Record<string, { name: string, count: number, progress: number }> = {};
            labels.forEach(label => {
                const userName = getObjectValue(label.user_id, 'name');
                let count = (userLabelCounts[userName]?.count || 0) + 1;
                userLabelCounts[userName] = {
                    name: userName,
                    count,
                    progress: Math.round(count / labels.length * 100)
                };
            });

            // Fetch count of Admins, Product, Brands and Label associated with the manufacturer's and it's company
            const manufacturer = await Manufacturer.findById(req.account?.associatedId).select('company_id')
            const brandsCount = await Brand.find({ company_id: manufacturer?.company_id }).count();
            const productsCount = await Product.find({ company_id: manufacturer?.company_id }).count();
            const adminCount = await Account.find({ associatedId: req.account?.associatedId }).count();
            const labelCount = await Label.find({ manufacture_id: req.account?.associatedId }).count();

            // Send the response with the calculated data
            res.status(200).json({
                success: true,
                data: {
                    userLabelCounts,
                    totalLabelsCount: labels.length,
                    monthLabelCounts,
                    stats: {

                        brandsCount,
                        productsCount,
                        adminCount,
                        labelCount
                    }
                },
            });
        } catch (error) {
            // Handle errors and pass them to the error handling middleware
            next(error);
        }
    }

    public async manufacturerLabelStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { date, brand_ids, product_ids, variants } = req.body;

            if (typeof date !== 'string') {
                throw new ErrorResponse(400, 'Please provide a valid date');
            }

            const { startDate, endDate } = getDates(date, 3);

            const filter: Record<string, any> = {
                createdAt: {
                    $gt: endDate,
                    $lte: startDate
                },
                user_id: req.account?._id,
                status: "show"
            };

            if (brand_ids) filter.brand_id = { $in: brand_ids };
            if (product_ids) filter.product_id = { $in: product_ids };
            if (variants) filter.variant = { $in: variants };

            const labels: ILabel[] = await Label
                .where({ manufacture_id: req.account?.associatedId })
                .find(filter)
                .populate({
                    path: 'user_id',
                    select: 'name',
                    model: 'Account'
                });

            const userLabelCounts = new Map<string, { name: string, count: number, progress: number }>();
            const monthLabelCounts: Record<string, number> = {};

            // Initialize monthLabelCounts with all months having a count of 0
            const currentDate = new Date(endDate);

            while (currentDate <= startDate) {
                const monthName = currentDate.toLocaleString('en-us', { month: 'short' });
                monthLabelCounts[monthName] = 0;

                // Move to the next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

            labels.forEach(label => {
                const monthYear = label.createdAt.toISOString().slice(0, 7);
                const monthName = new Date(monthYear + "-01").toLocaleString('en-us', { month: 'short' });
                monthLabelCounts[monthName] = (monthLabelCounts[monthName] || 0) + 1;

                const userName = getObjectValue(label.user_id, 'name');
                const userLabel = userLabelCounts.get(userName) || { name: userName, count: 0, progress: 0 };
                userLabel.count += 1;
                userLabel.progress = Math.round((userLabel.count / labels.length) * 100);
                userLabelCounts.set(userName, userLabel);
            });

            const manufacturer = await Manufacturer.findById(req.account?.associatedId).select('company_id');
            const [brandsCount, productsCount, labelCount] = await Promise.all([
                Brand.find({ company_id: manufacturer?.company_id }).count(),
                Product.find({ company_id: manufacturer?.company_id }).count(),
                Label.find({ manufacture_id: req.account?.associatedId }).count()
            ]);

            res.status(200).json({
                success: true,
                data: {
                    userLabelCounts: Array.from(userLabelCounts.values()),
                    monthLabelCounts,
                    stats: {
                        brandsCount,
                        productsCount,
                        labelCount
                    }
                },
            });
        } catch (error) {
            next(error);
        }
    }

    public async getBatchNumbersAndVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { product_ids } = req.body;

            if (!Array.isArray(product_ids)) {
                throw new ErrorResponse(400, 'Invalid input format');
            }

            const filter: Record<string, any> = {
                status: "show"
            };

            if (product_ids.length > 0) {
                filter.product_id = { $in: product_ids };
            }

            const labels: ILabel[] = await Label.find(filter).select('variant');

            res.status(200).json({
                success: true,
                data: labels
            });
        } catch (error) {
            next(error);
        }
    }

    public async labelBatchNumbers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { brand_id, product_id, variant } = req.body;

            const labels = await Label.find({ brand_id, product_id, variant, status: "show" }).select('batch_number')

            res.status(200).json({
                success: true,
                data: labels
            })
        } catch (error) {
            next(error);
        }
    }

    public async labelVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { brand_id, product_id } = req.body;

            const labels = await Label.find({ brand_id, product_id, status: "show" }).select('variant')

            res.status(200).json({
                success: true,
                data: labels
            })
        } catch (error) {
            next(error);
        }
    }

    public async multipleLabelVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { brand_ids, product_ids } = req.body;

            const labels = await Label.find({
                brand_id: { $in: brand_ids },
                product_id: { $in: product_ids },
                status: "show"
            }).select('variant');

            res.status(200).json({
                success: true,
                data: labels
            })
        } catch (error) {
            next(error);
        }
    }

    public async fetchProductVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { brand_ids, product_ids } = req.body;
            const filter: Record<string, any> = {
                brand_id: { $in: brand_ids },
                _id: { $in: product_ids }
            }
            const productVariants = await Product.find(filter).select('variants');
            res.status(200).json({
                success: true,
                data: productVariants?.flatMap(i => i.variants)
            })
        } catch (error) {
            next(error);
        }
    }

    public async labelCountInRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { brand_ids, product_ids, variants, date } = req.body;

            if (!Array.isArray(brand_ids) || !Array.isArray(product_ids) || !Array.isArray(variants) || !date) {
                throw new Error('Invalid request body');
            }

            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setMonth(endDate.getMonth() - 4); // Go 3 months back from the provided date

            const filter: any = {
                manufacture_id: req.account?.associatedId, // Adjust as per your setup
                createdAt: {
                    $gte: endDate,
                    $lte: startDate,
                },
                status: "show"
            };

            if (brand_ids.length > 0) filter.brand_id = { $in: brand_ids.map(id => new mongoose.Types.ObjectId(id)) };
            if (product_ids.length > 0) filter.product_id = { $in: product_ids.map(id => new mongoose.Types.ObjectId(id)) };
            if (variants.length > 0) filter.variant = { $in: variants };

            const labels: any[] = await Label.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count_of_label: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        count_of_label: 1,
                    },
                },
            ]);
            res.status(200).json({
                success: true,
                data: labels,
            });
        } catch (error) {
            console.log(error);

            next(error);
        }
    }

    public async fetchAndDownloadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract and validate query parameters
            const { date, company_ids, manufacturer_ids, brand_ids, product_ids, variants } = req.body;
            console.log(date);

            if (typeof date !== 'string') throw new ErrorResponse(400, 'Please provide a valid date');

            // Extracts the start date and end date based on the user-provided date, spanning two months.
            const { startDate, endDate } = getDates(date, 3);

            // Construct filter criteria based on query parameters.
            // Filters records based on creation date falling within the range of 2 months before the start date to the start date.
            const filter: Record<string, any> = {
                createdAt: {
                    $gt: endDate, // Records created after 2 months ago.
                    $lte: startDate // Records created within the last 2 months.
                },
                status: "show"
            };

            if (manufacturer_ids?.length > 0) {
                filter.manufacture_id = { $in: manufacturer_ids }
            } else if (company_ids?.length > 0) {
                const manufacturers = await Manufacturer.find({ company_id: { $in: company_ids }, status: 'show' });
                filter.manufacture_id = { $in: manufacturers.map(manufacturer => manufacturer._id) }
            }

            if (brand_ids) filter.brand_id = { $in: brand_ids };
            if (product_ids) filter.product_id = { $in: product_ids };
            if (variants) filter.variant = { $in: variants };

            // Fetch labels based on the filter criteria and populate the 'user_id' field with user data.
            const labels: ILabel[] = await Label
                .find(filter)

            console.log(labels);

            res.status(200).json({
                success: true,
                labels
            })
        } catch (error) {
            next(error);
        }
    }

    // Dashboard Filters
    // public async filterAndDownloadLabelCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         const { company_ids, manufacturer_ids, brand_ids, product_ids, variants, date, months = 4 } = req.body;
    //         const { endDate, startDate } = getCustomDateRange(date, months);
    //         const filter: Record<string, any> = {
    //             createdAt: {
    //                 $gte: startDate, // Start date
    //                 $lte: endDate, // End date
    //             },
    //             status: "show"
    //         };

    //         if (manufacturer_ids.length === 0 && company_ids.length > 0) {
    //             const manufacturers = (await Manufacturer.find({ status: 'active', company_id: { $in: company_ids } })).map(i => i._id);
    //             filter.manufacture_id = { $in: manufacturers }
    //         } else if (manufacturer_ids.length > 0) {
    //             filter.manufacture_id = { $in: manufacturer_ids }
    //         }

    //         // Add Manufacturer IDs, brand IDs, product IDs, variants from the request body to the filter criteria.

    //         if (Array.isArray(brand_ids)) filter.brand_id = { $in: brand_ids };
    //         if (Array.isArray(product_ids)) filter.product_id = { $in: product_ids };
    //         if (Array.isArray(variants)) filter.variant = { $in: variants };

    //         const labels = await Label.find(filter)
    //             .populate({
    //                 path: 'manufacture_id', select: 'name', model: 'Manufacturer'
    //             }) // Populate 'name' field from manufacture_id
    //             .populate({
    //                 path: 'brand_id', select: 'name', model: 'Brand'
    //             }) // Populate 'name' field from brand_id
    //             .populate({
    //                 path: 'product_id', select: 'name', model: 'Product'
    //             });

    //         // Group labels by month and count them
    //         const labelCountsByMonth: Record<string, any> = {};
    //         labels.forEach(label => {
    //             const monthYear = label.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
    //             if (!labelCountsByMonth[monthYear]) {
    //                 labelCountsByMonth[monthYear] = 1;
    //             } else {
    //                 labelCountsByMonth[monthYear]++;
    //             }
    //         });

    //         // Prepare output data for each month from startDate to endDate
    //         const outputData = [];
    //         let currentDate = new Date(startDate);
    //         while (currentDate <= endDate) {
    //             const monthYear = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    //             const count = labelCountsByMonth[monthYear] || 0;
    //             outputData.push({
    //                 month: monthYear.split(' ')[0], // Extracting month abbreviation
    //                 count: count,
    //                 date: currentDate.toLocaleDateString() // Formatting date
    //             });
    //             currentDate.setMonth(currentDate.getMonth() + 1);
    //             currentDate.setDate(1); // Set the date to the 1st for all months except the last one
    //         }

    //         // Adjust the date of the last element to the end date
    //         if (outputData.length > 0) {
    //             outputData[outputData.length - 1].date = endDate.toLocaleDateString();
    //         }

    //         const csvStream = csv.format({ headers: true });
    //         const writableStream = fs.createWriteStream('src/public/files/export/LabelStatistics.csv');

    //         csvStream.pipe(writableStream);

    //         writableStream.on('finish', () => {
    //             res.status(200).json({
    //                 success: true,
    //                 downloadURL: 'files/export/LabelStatistics.csv',
    //             });
    //         });

    //         if (labels.length > 0) {
    //             outputData.forEach((stats) => {
    //                 csvStream.write({
    //                     month: stats.month,
    //                     count: stats.count,
    //                     date: stats.date,
    //                 });
    //             });
    //         }

    //         csvStream.end();
    //         writableStream.end();
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    public async filterAndDownloadLabelCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { company_ids, manufacturer_ids, brand_ids, product_ids, variants, date, days = 120 } = req.body; // Change 'months' to 'days' and set a default of 120 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days); // Calculate the start date based on the number of days

            const filter: Record<string, any> = {
                createdAt: {
                    $gte: startDate, // Start date
                    $lte: endDate, // End date
                },
                status: "show"
            };

            if (manufacturer_ids.length === 0 && company_ids.length > 0) {
                const manufacturers = (await Manufacturer.find({ status: 'active', company_id: { $in: company_ids } })).map(i => i._id);
                filter.manufacture_id = { $in: manufacturers }
            } else if (manufacturer_ids.length > 0) {
                filter.manufacture_id = { $in: manufacturer_ids }
            }

            // Add Manufacturer IDs, brand IDs, product IDs, variants from the request body to the filter criteria.

            // Check if brand_ids is an array and not empty
            if (Array.isArray(brand_ids) && brand_ids.length > 0) {
                filter.brand_id = { $in: brand_ids };
            }

            // Check if product_ids is an array and not empty
            if (Array.isArray(product_ids) && product_ids.length > 0) {
                filter.product_id = { $in: product_ids };
            }

            // Check if variants is an array and not empty
            if (Array.isArray(variants) && variants.length > 0) {
                filter.variant = { $in: variants };
            }
            console.log(filter);

            const labels = await Label.find(filter)
                .populate({
                    path: 'manufacture_id', select: 'name', model: 'Manufacturer'
                })
                .populate({
                    path: 'brand_id', select: 'name', model: 'Brand'
                })
                .populate({
                    path: 'product_id', select: 'name', model: 'Product'
                });

            // Group labels by day and count them
            const labelCountsByDay: Record<string, any> = {};
            labels.forEach(label => {
                const labelDate = label.createdAt.toLocaleDateString();
                if (!labelCountsByDay[labelDate]) {
                    labelCountsByDay[labelDate] = 1;
                } else {
                    labelCountsByDay[labelDate]++;
                }
            });

            // Prepare output data for each day from startDate to endDate
            const outputData = [];
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const labelDate = currentDate.toLocaleDateString();
                const count = labelCountsByDay[labelDate] || 0;
                if (count > 1) { // Only include entries with count greater than 1
                    outputData.push({
                        day: labelDate,
                        count: count,
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const csvStream = csv.format({ headers: true });
            const writableStream = fs.createWriteStream('src/public/files/export/LabelStatistics.csv');

            csvStream.pipe(writableStream);

            writableStream.on('finish', () => {
                res.status(200).json({
                    success: true,
                    downloadURL: 'files/export/LabelStatistics.csv',
                });
            });

            if (labels.length > 0) {
                outputData.forEach((stats) => {
                    csvStream.write({
                        day: stats.day,
                        count: stats.count,
                    });
                });
            }

            csvStream.end();
            writableStream.end();
        } catch (error) {
            next(error);
        }
    }

    // public async manufacturerLabelFilterAndCSVDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         const { brand_ids, product_ids, variants, date, months = 4 } = req.body;
    //         const { endDate, startDate } = getCustomDateRange(date, months);
    //         const filter: Record<string, any> = {
    //             createdAt: {
    //                 $gte: startDate, // Start date
    //                 $lte: endDate, // End date
    //             },
    //             user_id: req.account?._id,
    //             status: "show"
    //         };

    //         // Add Manufacturer IDs, brand IDs, product IDs, variants from the request body to the filter criteria.

    //         if (Array.isArray(brand_ids)) filter.brand_id = { $in: brand_ids };
    //         if (Array.isArray(product_ids)) filter.product_id = { $in: product_ids };
    //         if (Array.isArray(variants)) filter.variant = { $in: variants };

    //         const labels = await Label.find(filter)
    //             .populate({
    //                 path: 'manufacture_id', select: 'name', model: 'Manufacturer'
    //             }) // Populate 'name' field from manufacture_id
    //             .populate({
    //                 path: 'brand_id', select: 'name', model: 'Brand'
    //             }) // Populate 'name' field from brand_id
    //             .populate({
    //                 path: 'product_id', select: 'name', model: 'Product'
    //             });

    //         // Group labels by month and count them
    //         const labelCountsByMonth: Record<string, any> = {};
    //         labels.forEach(label => {
    //             const monthYear = label.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
    //             if (!labelCountsByMonth[monthYear]) {
    //                 labelCountsByMonth[monthYear] = 1;
    //             } else {
    //                 labelCountsByMonth[monthYear]++;
    //             }
    //         });

    //         // Prepare output data for each month from startDate to endDate
    //         const outputData = [];
    //         let currentDate = new Date(startDate);
    //         while (currentDate <= endDate) {
    //             const monthYear = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    //             const count = labelCountsByMonth[monthYear] || 0;
    //             outputData.push({
    //                 month: monthYear.split(' ')[0], // Extracting month abbreviation
    //                 count: count,
    //                 date: currentDate.toLocaleDateString() // Formatting date
    //             });
    //             currentDate.setMonth(currentDate.getMonth() + 1);
    //             currentDate.setDate(1); // Set the date to the 1st for all months except the last one
    //         }

    //         // Adjust the date of the last element to the end date
    //         if (outputData.length > 0) {
    //             outputData[outputData.length - 1].date = endDate.toLocaleDateString();
    //         }

    //         const csvStream = csv.format({ headers: true });
    //         const writableStream = fs.createWriteStream('src/public/files/export/Manfacturer_Stats.csv');

    //         csvStream.pipe(writableStream);

    //         writableStream.on('finish', () => {
    //             res.status(200).json({
    //                 success: true,
    //                 downloadURL: 'files/export/Manfacturer_Stats.csv',
    //             });
    //         });

    //         if (labels.length > 0) {
    //             outputData.forEach((stats) => {
    //                 csvStream.write({
    //                     month: stats.month,
    //                     count: stats.count,
    //                     date: stats.date,
    //                 });
    //             });
    //         }

    //         csvStream.end();
    //         writableStream.end();
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    public async manufacturerLabelFilterAndCSVDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { brand_ids, product_ids, variants, date, days = 120 } = req.body; // Change 'months' to 'days' and set a default of 120 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days); // Calculate the start date based on the number of days

            const filter: Record<string, any> = {
                createdAt: {
                    $gte: startDate, // Start date
                    $lte: endDate, // End date
                },
                user_id: req.account?._id,
                status: "show"
            };

            // Add Manufacturer IDs, brand IDs, product IDs, variants from the request body to the filter criteria.
            if (Array.isArray(brand_ids)) filter.brand_id = { $in: brand_ids };
            if (Array.isArray(product_ids)) filter.product_id = { $in: product_ids };
            if (Array.isArray(variants)) filter.variant = { $in: variants };

            const labels = await Label.find(filter)
                .populate({
                    path: 'manufacture_id', select: 'name', model: 'Manufacturer'
                })
                .populate({
                    path: 'brand_id', select: 'name', model: 'Brand'
                })
                .populate({
                    path: 'product_id', select: 'name', model: 'Product'
                });

            // Group labels by day and count them
            const labelCountsByDay: Record<string, any> = {};
            labels.forEach(label => {
                const labelDate = label.createdAt.toLocaleDateString();
                if (!labelCountsByDay[labelDate]) {
                    labelCountsByDay[labelDate] = 1;
                } else {
                    labelCountsByDay[labelDate]++;
                }
            });

            // Prepare output data for each day from startDate to endDate, including only entries where count is greater than 1
            const outputData = [];
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const labelDate = currentDate.toLocaleDateString();
                const count = labelCountsByDay[labelDate] || 0;
                if (count > 1) { // Only include entries with count greater than 1
                    outputData.push({
                        day: labelDate,
                        count: count,
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const csvStream = csv.format({ headers: true });
            const writableStream = fs.createWriteStream('src/public/files/export/Manfacturer_Stats.csv');

            csvStream.pipe(writableStream);

            writableStream.on('finish', () => {
                res.status(200).json({
                    success: true,
                    downloadURL: 'files/export/Manfacturer_Stats.csv',
                });
            });

            if (labels.length > 0) {
                outputData.forEach((stats) => {
                    csvStream.write({
                        day: stats.day,
                        count: stats.count,
                    });
                });
            }

            csvStream.end();
            writableStream.end();
        } catch (error) {
            next(error);
        }
    }

    public async warrantiesCSVDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate, level } = req.body;

            const filter: Record<string, any> = {
                createdAt: {
                    $gte: endDate,
                    $lte: startDate,
                }
            }

            if (level === 2) {
                filter.company_id = req.account?._id
            }

            const warranties = await Warranty.find(filter);

            const csvStream = csv.format({ headers: true });
            const writableStream = fs.createWriteStream('src/public/files/export/warranty.csv');

            csvStream.pipe(writableStream);

            writableStream.on('finish', () => {
                res.status(200).json({
                    success: true,
                    downloadURL: 'files/export/warranty.csv',
                });
            });

            if (warranties.length > 0) {
                warranties.forEach((warranty: any) => {
                    csvStream.write({
                        DS1: warranty.DS1,
                        warranty_activated: warranty.warranty_activated.toString(),
                        purchase_date: warranty.purchase_date,
                        store_name: warranty.store_name,
                        store_pin_code: warranty.store_pin_code,
                        warranty_duration: warranty.warranty_duration,
                        invoice_number: warranty.invoice_number,
                        invoice_image: warranty.invoice_image,
                        pincode: warranty.pincode,
                        address1: warranty.address1,
                        address2: warranty.address2 || '',
                        CreatedAt: warranty.createdAt.toISOString(),
                    });
                })
            }

            csvStream.end();
            writableStream.end();
        } catch (error) {
            next(error);
        }
    }

    public async reqHelpOnLabelCSVDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate, level } = req.body;

            const filter: Record<string, any> = {
                createdAt: {
                    $gte: endDate,
                    $lte: startDate,
                }
            }

            if (level === 2) {
                filter.company_id = req.account?._id
            }

            const requestHelpOnLabel = await RequestHelpOnLabel.find(filter)
                .populate({
                    path: 'company_id', select: 'name', model: 'Company'
                }) // Populate 'name' field from company
                .populate({
                    path: 'brand_id', select: 'name', model: 'Brand'
                }) // Populate 'name' field from brand_id
                .populate({
                    path: 'product_id', select: 'name', model: 'Product'
                });

            const csvStream = csv.format({ headers: true });
            const writableStream = fs.createWriteStream('src/public/files/export/request_help.csv');

            csvStream.pipe(writableStream);

            writableStream.on('finish', () => {
                res.status(200).json({
                    success: true,
                    downloadURL: 'files/export/request_help.csv',
                });
            });

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

            if (requestHelpOnLabel.length > 0) {
                requestHelpOnLabel.forEach((reqHelp: any) => {
                    csvStream.write({
                        DS1: reqHelp.DS1,
                        request_date: reqHelp.request_date.toISOString(),
                        company_id: getObjectValue(reqHelp.company_id, "name"),
                        brand: getObjectValue(reqHelp.brand_id, "name"),
                        product: getObjectValue(reqHelp.product_id, "name"),
                        help_ref_num: reqHelp.help_ref_num,
                        address: reqHelp.address,
                        pincode: reqHelp.pincode,
                        CreatedAt: reqHelp.createdAt.toISOString(),
                    })
                })
            }

            csvStream.end();
            writableStream.end();
        } catch (error) {
            next(error);
        }
    }

    public async reportErrorCSVDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate, level } = req.body;

            const filter: Record<string, any> = {
                createdAt: {
                    $gte: endDate,
                    $lte: startDate,
                }
            }

            if (level === 2) {
                filter.company_id = req.account?._id
            }

            const reportErrors = await ErrorReport.find(filter)
                .populate({
                    path: 'brand_id', select: 'name', model: 'Brand'
                }) // Populate 'name' field from brand_id
                .populate({
                    path: 'product_id', select: 'name', model: 'Product'
                });;;;

            const csvStream = csv.format({ headers: true });
            const writableStream = fs.createWriteStream('src/public/files/export/error_reports.csv');

            csvStream.pipe(writableStream);

            writableStream.on('finish', () => {
                res.status(200).json({
                    success: true,
                    downloadURL: 'files/export/error_reports.csv',
                });
            });

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

            if (reportErrors.length > 0) {
                reportErrors.forEach((reportError: any) => {
                    csvStream.write({
                        brand: getObjectValue(reportError.brand_id, "name"),
                        product: getObjectValue(reportError.product_id, "name"),
                        store_and_location: reportError.store_and_location,
                        purchase_date: reportError.purchase_date,
                        store_pin_code: reportError.store_pin_code,
                        CreatedAt: reportError.createdAt.toISOString(),
                    });
                })
            }

            csvStream.end();
            writableStream.end();

        } catch (error) {
            next(error);
        }
    }
}

export default new CombineController()