import { removeTmp } from "./remove_folder.utils.js";
import cloudinary from 'cloudinary';
import { validateVideo } from "./validate_mimetype.utils.js";
const videoUploadToCloudinary = async (file, folderName) => {
    const isValidFile = validateVideo(file); // Implement your validation function
    if (isValidFile) {
        // Upload the video to Cloudinary
        const videoResult = await cloudinary.v2.uploader.upload(file.path, {
            resource_type: "video",
            folder: folderName,
            chunk_size: 15000000,
            eager: [
                { width: 300, height: 300 },
                { width: 160, height: 100, gravity: "south" }
            ],
            eager_async: true,
        });
        removeTmp(file.path);
        return videoResult;
    }
};
export { videoUploadToCloudinary };
//# sourceMappingURL=uploadVideo.js.map