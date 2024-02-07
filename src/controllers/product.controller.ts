import { NextFunction, Request, Response } from "express";
import { ListFormat } from "../utils/ListFormat.js";
import Product, { IProduct } from "../models/product.model.js";
import { videoUploadToCloudinary } from "../utils/uploadVideo.js";
import { multiImagesUpload } from "../utils/uploadImages.js";
import cloudinary from 'cloudinary';
import { extractPublicIdFromUrl } from "../utils/extractPublicIdFromURL.js";
import { ErrorResponse } from "../utils/error_response.utils.js";

class ProductController {
    // Create a new Product with images and video
    public async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (req.body.feature) {
                req.body['feature'] = JSON.parse(req.body.feature);
            }

            req.body['carousel_headings'] = ListFormat(req.body.carousel_headings);
            req.body['carousel_text'] = ListFormat(req.body.carousel_text);
            req.body['variants'] = ListFormat(req.body.variants);

            const productInfo: IProduct = req.body;
            productInfo.user_id = req.account?._id;
            if (req.account?.associatedId) productInfo.company_id = req.account.associatedId;
            const files = req.files as { images: Express.Multer.File[], video: Express.Multer.File[] };

            // Handle image uploads similar to your previous controller
            const imageFiles: Express.Multer.File[] = (files.images as Express.Multer.File[]) || [];
            if (imageFiles.length > 0) {
                const imageUrls = await multiImagesUpload(imageFiles, 'product-images');
                if (imageUrls) {
                    productInfo.images = imageUrls;
                } else {
                    productInfo.images = null;
                }
            }

            // Handle video upload
            const videoFile = files.video && files.video[0];
            if (videoFile) {
                // Upload the video to Cloudinary
                const videoResult = await videoUploadToCloudinary(videoFile, 'product-videos');

                if (videoResult) {
                    // Set the video URL in productInfo
                    productInfo.video_url = {
                        url: videoResult.secure_url,
                        publicId: videoResult.public_id
                    };
                }
            } else {
                if (req.body.video_url) {
                    productInfo.video_url = {
                        url: req.body.video_url,
                        publicId: ""
                    }
                }
            }
            // Create the product with the provided information (including images and video)
            await Product.create(productInfo);

            res.status(201).json({ success: true, message: 'Product created successfully.' });
        } catch (error) {
            // Handle any errors that may occur during product creation or image/video upload
            next(error);
        }
    }

    // Fetch all products including the searching, sorting and paginating 
    public async getAllProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
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
            const products = await Product.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'company_id',
                    select: 'name',
                    model: 'Company'
                })
                .populate({
                    path: 'sub_category_id',
                    select: 'title features',
                    model: 'Subcategory'
                })
                .populate({
                    path: 'brand_id',
                    select: 'name', // Select only the 'name' field from the referenced documents
                    model: 'Brand'
                })

            const getObjectValue = (obj: any, key: string) => {
                if (obj[key]) {
                    return obj[key];
                }

                return obj;
            }

            const productsWithPopulatedData = products.map((product) => ({
                ...product.toObject(),
                company: getObjectValue(product.company_id, 'name'), // Rename to 'companyObj'
                brand: getObjectValue(product.brand_id, 'name'), // Rename to 'brandObj'
                sub_category: getObjectValue(product.sub_category_id, 'title'), // Rename to 'sub_category_idObj'
                feature: product.feature
            }));

            // Calculate the total count of matching products (for pagination)
            const totalCount = await Product.countDocuments(filter);

            // Respond with the paginated and sorted products
            res.status(200).json({
                success: true,
                data: productsWithPopulatedData,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit,
                },
            });
        } catch (error) {
            console.log(error);

            // Handle any errors that may occur during product retrieval
            next(error);
        }
    }

    // Update a product by id
    public async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (req.body.feature) {
                req.body['feature'] = JSON.parse(req.body.feature);
            }

            req.body['carousel_headings'] = ListFormat(req.body.carousel_headings);
            req.body['carousel_text'] = ListFormat(req.body.carousel_text);
            req.body['variants'] = ListFormat(req.body.variants);

            const productInfo: IProduct = req.body;
            const files = req.files as { images: Express.Multer.File[], video: Express.Multer.File[] };

            // Get the existing product data from the database
            const existingProduct = await Product.findById(id);

            // Check if videoURL doesn't have a videoLink and a videoFile is provided
            if (productInfo.video_url) {
                productInfo['video_url'] = null
                // Remove the old video from Cloudinary (if it exists)
                if (existingProduct?.video_url && existingProduct.video_url.publicId) {
                    await cloudinary.v2.uploader.destroy(existingProduct.video_url.publicId);
                }
            }
            else if (files.video && files.video[0]) {
                // Upload the new video to Cloudinary
                const videoResult = await videoUploadToCloudinary(files.video[0], 'product-videos');

                if (videoResult) {
                    // Remove the old video from Cloudinary (if it exists)
                    if (existingProduct?.video_url && existingProduct.video_url.publicId) {
                        await cloudinary.v2.uploader.destroy(existingProduct.video_url.publicId);
                    }

                    // Set the new video URL in productInfo
                    productInfo.video_url = { url: videoResult.secure_url, publicId: videoResult.public_id };
                    productInfo['video_url'] = null
                }
            } else {
                if (req.body.video_url) {
                    productInfo.video_url = {
                        url: req.body.video_url,
                        publicId: ""
                    }
                }
            }

            // Handle image uploads and updates
            const imageFiles: Express.Multer.File[] = (files.images as Express.Multer.File[]) || [];
            const oldImages: string[] = productInfo.images || [];

            if (imageFiles.length > 0 || (oldImages && oldImages.length > 0)) {
                // Fetch the existing image URLs
                const existingImageURLs = existingProduct?.images || [];

                // Validate and upload new images
                const newImageUrls = await multiImagesUpload(imageFiles, 'product-images');

                // Combine new image URLs with existing ones while excluding removed images
                const updatedImageURLs = [
                    ...(existingImageURLs || []),
                    ...(newImageUrls || []),
                ].filter((url) => oldImages ? !oldImages.includes(url) : true);
                console.log(updatedImageURLs);
                
                productInfo.images = updatedImageURLs.length > 0 ? updatedImageURLs : null;
            }

            // Update the product with the provided information (including images and video)
            const updatedProduct = await Product.findByIdAndUpdate(id, productInfo, { new: true });

            res.status(200).json({ success: true, message: 'Product updated successfully.', data: updatedProduct });
        } catch (error) {
            console.log(error);
            // Handle any errors that may occur during product update, image/video upload, or Cloudinary operations
            next(error);
        }
    }

    // Toggle Product status
    public async toggleProductStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);

            if (!product) {
                throw new Error('Product not found');
            }

            product.status = product.status === 'show' ? 'hide' : 'show';
            await product.save();

            let message = product.status === 'show' ? 'Product Published' : 'Product Un-Published';

            res.status(200).json({ success: true, message: `${message}` });
        } catch (error) {
            next(error);
        }
    }

    // Destroy images and update the product
    public async destroyImages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { publicIds } = req.body;

            // Get the existing product data from the database
            const existingProduct = await Product.findById(id);

            // Ensure existingProduct is available
            if (!existingProduct) {
                res.status(404).json({ success: false, message: 'Product not found.' });
                return;
            }

            // Remove images with matching public IDs from Cloudinary
            for (const publicId of publicIds) {
                if (publicId) {
                    await cloudinary.v2.uploader.destroy(publicId);
                }
            }

            // Update the images list by removing URLs with matching public IDs
            const updatedImagesURLs = (existingProduct.images || []).filter((url) => {
                const publicId = extractPublicIdFromUrl(url);
                return !publicIds.includes(publicId);
            });

            // Update the product with the new images
            existingProduct.images = updatedImagesURLs;
            const updatedProduct = await existingProduct.save();

            res.status(200).json({ success: true, message: 'Images destroyed and updated successfully.', data: updatedProduct });
        } catch (error) {
            // Handle any errors that may occur during image destruction or database update
            next(error);
        }
    }

    // Delete one product by the ID and destroyed the images and video that are saved 
    public async deleteOneProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            // Find the product to delete by its ID
            const productToDelete = await Product.findById(id);

            if (!productToDelete) {
                // Product not found
                throw new ErrorResponse(404, 'Product not found');
            }

            // Delete images and video associated with the product from Cloudinary
            if (productToDelete.images && productToDelete.images.length > 0) {
                for (const imageUrl of productToDelete.images) {
                    const publicId = imageUrl.split('/').pop(); // Extract the public ID from the URL
                    if (publicId) {
                        await cloudinary.v2.uploader.destroy(publicId);
                    }
                }
            }

            if (productToDelete.video_url && productToDelete.video_url.publicId) {
                await cloudinary.v2.uploader.destroy(productToDelete.video_url.publicId);
            }

            // Delete the product from the database
            await Product.findByIdAndDelete(id);

            res.status(200).json({ success: true, message: 'Product deleted successfully.' });
        } catch (error) {
            // Handle any errors that may occur during product deletion or Cloudinary operations
            next(error);
        }
    }

    // Delete many products that are coming in the request body and destroy the images and the video
    public async deleteManyProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { ids } = req.params; // Extract product IDs from URL params

            // Split the IDs string into an array
            const productIds = ids.split(',');

            // Find and delete multiple products by their IDs
            const productsToDelete = await Product.find({ _id: { $in: productIds } });

            if (!productsToDelete || productsToDelete.length === 0) {
                // No products found to delete
                throw new ErrorResponse(404, 'No products found to delete');
            }

            for (const product of productsToDelete) {
                // Delete images and video associated with the product from Cloudinary
                if (product.images && product.images.length > 0) {
                    for (const imageUrl of product.images) {
                        const publicId = imageUrl.split('/').pop(); // Extract the public ID from the URL
                        if (publicId) {
                            await cloudinary.v2.uploader.destroy(publicId);
                        }
                    }
                }

                if (product.video_url && product.video_url.publicId) {
                    await cloudinary.v2.uploader.destroy(product.video_url.publicId);
                }
            }

            // Delete the products from the database
            await Product.deleteMany({ _id: { $in: productIds } });

            res.status(200).json({ success: true, message: 'Products deleted successfully.' });
        } catch (error) {
            // Handle any errors that may occur during product deletion or Cloudinary operations
            next(error);
        }
    }
}

export default new ProductController();