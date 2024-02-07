import { ErrorResponse } from "./error_response.utils.js";
import { formatBytesToMB } from "./formatByteToMB.js";

// Define the maximum allowed file size in bytes (e.g., 5MB)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const validateMimeType = (file: Express.Multer.File): boolean => {
    // Check file MIME type
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/svg', 'image/svg+xml'];
    if (!allowedFileTypes.includes(file.mimetype)) {
        throw new ErrorResponse(400, `Invalid image ${file.originalname} of type ${file.mimetype}`)
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
        let exceededSize = formatBytesToMB(file.size);
        // File size exceeds the maximum limit
        throw new ErrorResponse(400, `Invalid image ${file.originalname} of size ${exceededSize}`)
    }

    return true; // File is valid
};

export const validateVideo = (file: Express.Multer.File): boolean => {
    // Check video MIME type
    const allowedVideoTypes = ['video/mp4'];
    if (!allowedVideoTypes.includes(file.mimetype)) {
        throw new ErrorResponse(400, `Invalid video ${file.originalname} of type ${file.mimetype}`)
    }

    // Check video size
    if (file.size > 10485760) {
        let exceededSize = formatBytesToMB(file.size);
        // Video size exceeds the maximum limit
        throw new ErrorResponse(400, `Invalid video ${file.originalname} of size ${exceededSize}`)
    }

    return true; // Video is valid
}
