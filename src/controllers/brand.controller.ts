import { Request, Response, NextFunction } from 'express';
import Brand, { IBrand } from '../models/brand.model.js';
import { multiImagesUpload } from '../utils/uploadImages.js';
import { videoUploadToCloudinary } from '../utils/uploadVideo.js';
import cloudinary from 'cloudinary';
import { extractPublicIdFromUrl } from '../utils/extractPublicIdFromURL.js';
import { ErrorResponse } from '../utils/error_response.utils.js';
import { ListFormat } from '../utils/ListFormat.js';

// Your Cloudinary and file handling functions here
class BrandController {
    // Create a new Brands with images and video
    public async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            req.body['carousel_headings'] = ListFormat(req.body.carousel_headings);
            req.body['carousel_text'] = ListFormat(req.body.carousel_text);

            // add user id
            req.body['user_id'] = req.account?._id;

            const brandInfo: IBrand = req.body;
            let files = req.files as { images: Express.Multer.File[], video: Express.Multer.File[] }

            if(!files.images || files.images?.length === 0) throw new ErrorResponse(400, `Failed! Please Upload Images`);

            // Check if videoURL doesn't have a videoLink and a videoFile is provided
            if (!brandInfo.videoURL && files.video) {
                // Upload the video to Cloudinary
                const videoResult = await videoUploadToCloudinary(files.video[0], 'brand-videos');

                if (videoResult) {
                    // Set the video URL in brandInfo
                    brandInfo['videoSource'] = { url: videoResult.secure_url, publicId: videoResult.public_id };
                }
            }

            // Handle image uploads similar to your previous controller
            const imageFiles: Express.Multer.File[] = (files.images as Express.Multer.File[]) || [];
            if (imageFiles.length > 0) {

                const imageUrls = await multiImagesUpload(imageFiles, 'product-images');
                if (imageUrls) {
                    // Add image URLs to brandInfo
                    brandInfo.images = imageUrls;
                } else {
                    brandInfo.images = null;
                }
            }

            // Create the brand with the provided information (including images and video)
            await Brand.create(brandInfo);

            res.status(201).json({ success: true, message: 'Brand created successfully.', data: "" });
        } catch (error) {           
            // Handle any errors that may occur during brand creation or image/video upload
            next(error);
        }
    }

    // Fetch All Brand including the searching, sorting and paginating
    public async getAllBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
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
                filter.name = { $regex: new RegExp(nameQuery, 'i') };
            }

            // Calculate skip value for pagination
            const skip: number = (page - 1) * limit;

            // Define sort object for MongoDB
            const sort: { [key: string]: 'asc' | 'desc' } = {};
            sort[sortBy] = sortOrder;

            // Query the database with pagination, sorting, and filtering
            const brands = await Brand.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'company_id',
                    select: 'name', // Select only the 'name' field from the company document
                    model: 'Company', // Specify the model to use for population
                });

            const getObjectValue = (obj: any, key: string) => {
                return obj[key];
            }

            // Map the results and rename the 'company' field to 'companyObj'
            const brandsWithCompanyData = brands.map((brand) => ({
                ...brand.toObject(),
                company: getObjectValue(brand.company_id, 'name') // Rename to 'companyObj'
            }));

            // Calculate the total count of matching brands (for pagination)
            const totalCount = await Brand.countDocuments(filter);

            // Respond with the paginated and sorted brands
            res.status(200).json({
                success: true,
                data: brandsWithCompanyData,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit,
                },
            });
        } catch (error) {
            // Handle any errors that may occur during brand retrieval
            next(error);
        }
    }

    // Update a brand by id
    public async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            req.body['carousel_headings'] = ListFormat(req.body.carousel_headings);
            req.body['carousel_text'] = ListFormat(req.body.carousel_text);

            const brandInfo: IBrand = req.body;
            const files = req.files as { images: Express.Multer.File[], video: Express.Multer.File[] };

            // Get the existing brand data from the database
            const existingBrand = await Brand.findById(id);

            // Check if videoURL doesn't have a videoLink and a videoFile is provided
            if (brandInfo.videoURL) {
                brandInfo['videoSource'] = null
                // Remove the old video from Cloudinary (if it exists)
                if (existingBrand?.videoSource && existingBrand.videoSource.publicId) {
                    await cloudinary.v2.uploader.destroy(existingBrand.videoSource.publicId);
                }
            }
            else if (files.video && files.video[0]) {
                // Upload the new video to Cloudinary
                const videoResult = await videoUploadToCloudinary(files.video[0], 'brand-videos');

                if (videoResult) {
                    // Remove the old video from Cloudinary (if it exists)
                    if (existingBrand?.videoSource && existingBrand.videoSource.publicId) {
                        await cloudinary.v2.uploader.destroy(existingBrand.videoSource.publicId);
                    }

                    // Set the new video URL in brandInfo
                    brandInfo.videoSource = { url: videoResult.secure_url, publicId: videoResult.public_id };
                    brandInfo['videoURL'] = null
                }
            }


            // Handle image uploads and updates
            const imageFiles: Express.Multer.File[] = (files.images as Express.Multer.File[]) || [];
            const oldImages: string[] = brandInfo.images || [];

            if (imageFiles.length > 0 || (oldImages && oldImages.length > 0)) {
                // Fetch the existing image URLs
                const existingImageURLs = existingBrand?.images || [];

                // Validate and upload new images
                const newImageUrls = await multiImagesUpload(imageFiles, 'product-images');

                // Combine new image URLs with existing ones while excluding removed images
                const updatedImageURLs = [
                    ...(existingImageURLs || []),
                    ...(newImageUrls || []),
                ].filter((url) => oldImages ? !oldImages.includes(url) : true);

                brandInfo.images = updatedImageURLs.length > 0 ? updatedImageURLs : null;
            }

            // Update the brand with the provided information (including images and video)
            const updatedBrand = await Brand.findByIdAndUpdate(id, brandInfo, { new: true });

            res.status(200).json({ success: true, message: 'Brand updated successfully.', data: updatedBrand });
        } catch (error) {
            // Handle any errors that may occur during brand update, image/video upload, or Cloudinary operations
            next(error);
        }
    }

    // Toggle Brand status
    public async toggleBrandStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const brand = await Brand.findById(id);

            if (!brand) {
                throw new Error('Brand not found');
            }

            brand.status = brand.status === 'show' ? 'hide' : 'show';
            await brand.save();

            let message = brand.status === 'show' ? 'Brand Published' : 'Brand Un-Published';

            res.status(200).json({ success: true, message: `${message}` });
        } catch (error) {
            next(error);
        }
    }

    // Destroy images and update the brand
    public async destroyImages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { publicIds } = req.body;

            // Get the existing brand data from the database
            const existingBrand = await Brand.findById(id);

            // Ensure existingBrand is available
            if (!existingBrand) {
                res.status(404).json({ success: false, message: 'Brand not found.' });
                return;
            }

            // Remove images with matching public IDs from Cloudinary
            for (const publicId of publicIds) {
                if (publicId) {
                    await cloudinary.v2.uploader.destroy(publicId);
                }
            }

            // Update the images list by removing URLs with matching public IDs
            const updatedImagesURLs = (existingBrand.images || []).filter((url) => {
                const publicId = extractPublicIdFromUrl(url);
                return !publicIds.includes(publicId);
            });

            // Update the brand with the new images
            existingBrand.images = updatedImagesURLs;
            const updatedBrand = await existingBrand.save();

            res.status(200).json({ success: true, message: 'Images destroyed and updated successfully.', data: updatedBrand });
        } catch (error) {
            // Handle any errors that may occur during image destruction or database update
            next(error);
        }
    }

    // Delete one brand by the ID and destroyed the images and video that are saved 
    public async deleteOneBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            // Find the brand to delete by its ID
            const brandToDelete = await Brand.findById(id);

            if (!brandToDelete) {
                // Brand not found
                throw new ErrorResponse(404, 'Brand not found');
            }

            // Delete images and video associated with the brand from Cloudinary
            if (brandToDelete.images && brandToDelete.images.length > 0) {
                for (const imageUrl of brandToDelete.images) {
                    const publicId = imageUrl.split('/').pop(); // Extract the public ID from the URL
                    if (publicId) {
                        await cloudinary.v2.uploader.destroy(publicId);
                    }
                }
            }

            if (brandToDelete.videoSource && brandToDelete.videoSource.publicId) {
                await cloudinary.v2.uploader.destroy(brandToDelete.videoSource.publicId);
            }

            // Delete the brand from the database
            await Brand.findByIdAndDelete(id);

            res.status(200).json({ success: true, message: 'Brand deleted successfully.' });
        } catch (error) {
            // Handle any errors that may occur during brand deletion or Cloudinary operations
            next(error);
        }
    }

    // Delete many brands that are coming in the request body and destroy the images and the video
    public async deleteManyBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { ids } = req.params; // Extract brand IDs from URL params

            // Split the IDs string into an array
            const brandIds = ids.split(',');

            // Find and delete multiple brands by their IDs
            const brandsToDelete = await Brand.find({ _id: { $in: brandIds } });

            if (!brandsToDelete || brandsToDelete.length === 0) {
                // No brands found to delete
                throw new ErrorResponse(404, 'No brands found to delete');
            }

            for (const brand of brandsToDelete) {
                // Delete images and video associated with the brand from Cloudinary
                if (brand.images && brand.images.length > 0) {
                    for (const imageUrl of brand.images) {
                        const publicId = imageUrl.split('/').pop(); // Extract the public ID from the URL
                        if (publicId) {
                            await cloudinary.v2.uploader.destroy(publicId);
                        }
                    }
                }

                if (brand.videoSource && brand.videoSource.publicId) {
                    await cloudinary.v2.uploader.destroy(brand.videoSource.publicId);
                }
            }

            // Delete the brands from the database
            await Brand.deleteMany({ _id: { $in: brandIds } });

            res.status(200).json({ success: true, message: 'Brands deleted successfully.' });
        } catch (error) {
            // Handle any errors that may occur during brand deletion or Cloudinary operations
            next(error);
        }
    }

}

export default new BrandController();
