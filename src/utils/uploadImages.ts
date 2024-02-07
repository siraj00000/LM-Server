import { ErrorResponse } from "./error_response.utils.js";
import { formatBytesToMB } from "./formatByteToMB.js";
import { removeTmp } from "./remove_folder.utils.js";
import { validateMimeType } from "./validate_mimetype.utils.js";
import cloudinary from 'cloudinary';

const multiImagesUpload = async (files: Express.Multer.File[], folderName: string) => {
    // Validate image file types (e.g., check mime types)
    for (const file of files) {
        const isValidFile = validateMimeType(file); // Implement your validation function

        if (isValidFile) {
            // Upload the image files to Cloudinary
            const imageUrls = await Promise.all(
                files.map(async (file: Express.Multer.File) => {
                    const result = await cloudinary.v2.uploader.upload(file.path, {
                        folder: folderName // Set the folder name to store product images in Cloudinary
                    });
                    // Remove the temporary image file
                    removeTmp(file.path); // Implement your function to remove temporary files
                    return result.secure_url;
                })
            );

            return imageUrls
        }
    }
}

export {
    multiImagesUpload
}