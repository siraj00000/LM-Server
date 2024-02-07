import Brand from "../models/brand.model.js";
import { ErrorResponse } from "../utils/error_response.utils.js";
import Label from "../models/label.model.js";
import mongoose from "mongoose";
import { ListFormat } from "../utils/ListFormat.js";
import csv from 'fast-csv';
import fs from 'fs';
/**
 * Controller class for creating labels.
 */
class LabelController {
    /**
     * Create labels with the given data.
     *
     * @param {Request} req - Express Request object containing the request data.
     * @param {Response} res - Express Response object for sending the response.
     * @param {NextFunction} next - Express Next function for handling errors.
     * @returns {Promise<void>}
     */
    async createLabel(req, res, next) {
        try {
            // add user id
            req.body['user_id'] = req.account?._id;
            // Extract data from the request body
            const { brand_id, product_id, batch_number, number_of_serials } = req.body;
            // Find the brand based on brand_id
            const brand = await Brand.findById(brand_id);
            // If the brand is not found, throw an error
            if (!brand)
                throw new ErrorResponse(400, "Brand not found!");
            // Get the brand name
            const brandName = brand.name;
            // Set manufacturer id
            req.body['manufacture_id'] = req.account?.associatedId;
            // Iterate through serial numbers and create labels
            for (let index = 1; index <= number_of_serials; index++) {
                // Generate DS1 and DS2 URLs
                req.body['DS1'] = generateURL('DS1', brandName, product_id, batch_number, Number(index));
                req.body['DS2'] = generateURL('DS2', brandName, product_id, batch_number, Number(index));
                req.body['serial_number'] = index;
                // Create a label with the generated data
                await Label.create(req.body);
            }
            // Respond with a success message
            res.status(201).json({ success: true, message: 'Labels created successfully.' });
        }
        catch (error) {
            // Handle errors and pass them to the next middleware
            next(error);
        }
    }
    /**
     * Update a label by its ID.
     *
     * @param {Request} req - Express Request object containing the request data.
     * @param {Response} res - Express Response object for sending the response.
     * @param {NextFunction} next - Express Next function for handling errors.
     * @returns {Promise<void>}
    */
    async updateLabel(req, res, next) {
        try {
            const { id } = req.params; // Extract the label ID from the request parameters
            const labelToUpdate = await Label.findById(id);
            // Check if the label with the given ID exists
            if (!labelToUpdate) {
                throw new ErrorResponse(404, "Label not found.");
            }
            // Save the updated label
            const updatedLabel = await Label.findByIdAndUpdate(req.body, { new: true });
            res.status(200).json({ success: true, data: updatedLabel });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update multiple labels by their IDs.
     *
     * @param {Request} req - Express Request object containing the request data with an array of label IDs.
     * @param {Response} res - Express Response object for sending the response.
     * @param {NextFunction} next - Express Next function for handling errors.
     * @returns {Promise<void>}
     *
     * @throws {ErrorResponse} 500 - If any server error occurs during the update process.
     */
    async updateManyLabels(req, res, next) {
        try {
            req.body['labelIds'] = ListFormat(req.body.labelIds);
            // Extract the list of label IDs from the request body
            const labelIdsToUpdate = req.body.labelIds;
            // Create an array of promises for updating labels
            const updatePromises = labelIdsToUpdate.map(async (labelId) => {
                // Update the label with the data from req.body
                const updatedLabel = await Label.findByIdAndUpdate(labelId, req.body, { new: true });
                // If the label is not found, you can handle it accordingly, e.g., log an error
                if (!updatedLabel) {
                    return null; // Skip this label if not found
                }
                return updatedLabel;
            });
            // Wait for all update promises to resolve
            const updatedLabelsResult = await Promise.all(updatePromises);
            // Filter out null values (labels not found) and get the updated labels
            const updatedLabels = updatedLabelsResult.filter(label => label !== null);
            res.status(200).json({ success: true, data: updatedLabels, message: 'Labels updated successfully.' });
        }
        catch (error) {
            console.log(error, req.body);
            // Pass the error to the error handling middleware
            next(error);
        }
    }
    /**
   * Fetch all labels including pagination, sorting, and populating related data.
   *
   * @param {Request} req - Express Request object containing the request data.
   * @param {Response} res - Express Response object for sending the response.
   * @param {NextFunction} next - Express Next function for handling errors.
   * @returns {Promise<void>}
   */
    async getAllLabels(req, res, next) {
        try {
            // Define pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Define sorting options
            const sortBy = req.query.sortBy || 'brand';
            const sortOrder = (req.query.sortOrder || 'asc') === 'desc' ? 'desc' : 'asc';
            // Build the filter object based on search criteria (if needed)
            const filter = {};
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            // Define sort object for MongoDB
            const sort = {};
            sort[sortBy] = sortOrder;
            // Query the database with pagination, sorting, and filtering
            const labels = await Label.find(filter)
                .where({ user_id: req.account?._id })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                path: 'manufacture_id', select: 'name', model: 'Manufacturer'
            }) // Populate 'name' field from manufacture_id
                .populate({
                path: 'brand_id', select: 'name', model: 'Brand'
            }) // Populate 'name' field from brand_id
                .populate({
                path: 'product_id', select: 'name', model: 'Product'
            }); // Populate 'title' field from product_id
            const getObjectValue = (obj, key) => {
                return obj[key];
            };
            // Map the labels and add the populated data to the response
            const labelsWithPopulatedData = labels.map((label) => ({
                ...label.toObject(),
                manufacture: getObjectValue(label.manufacture_id, "name"),
                brand: getObjectValue(label.brand_id, "name"),
                product: getObjectValue(label.product_id, "name"),
            }));
            // Calculate the total count of matching labels (for pagination)
            const totalCount = await Label.countDocuments(filter);
            // Respond with the paginated and sorted labels
            res.status(200).json({
                success: true,
                data: labelsWithPopulatedData,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit,
                },
            });
        }
        catch (error) {
            console.log(error);
            // Handle any errors that may occur during label retrieval
            next(error);
        }
    }
    /**
     * Toggle the status of a label by its ID.
     *
     * @param {Request} req - Express Request object containing the request data.
     * @param {Response} res - Express Response object for sending the response.
     * @param {NextFunction} next - Express Next function for handling errors.
     * @returns {Promise<void>}
     */
    async toggleLabelStatus(req, res, next) {
        try {
            const { id } = req.params;
            // Find the label by its ID
            const label = await Label.findById(id);
            // Check if the label exists
            if (!label) {
                throw new Error('Label not found');
            }
            // Toggle the label's status between 'show' and 'hide'
            label.status = label.status === 'show' ? 'hide' : 'show';
            // Save the updated label
            await label.save();
            // Determine the message based on the updated status
            let message = label.status === 'show' ? 'Label Published' : 'Label Un-Published';
            // Respond with success and the updated message
            res.status(200).json({ success: true, message: `${message}` });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a label by its ID.
     *
     * @param {Request} req - Express Request object containing the request data.
     * @param {Response} res - Express Response object for sending the response.
     * @param {NextFunction} next - Express Next function for handling errors.
     * @returns {Promise<void>}
    */
    async deleteOneLabel(req, res, next) {
        try {
            const { id } = req.params; // Extract the label ID from the request parameters
            // Check if the provided ID is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ErrorResponse(400, "Invalid label ID format.");
            }
            const labelToDelete = await Label.findById(id);
            // Check if the label with the given ID exists
            if (!labelToDelete) {
                throw new ErrorResponse(404, "Label not found.");
            }
            // Delete the label
            await labelToDelete.remove();
            res.status(204).json(); // Respond with no content for a successful deletion
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete multiple labels by their IDs.
     *
     * @param {Request} req - Express Request object containing the request data.
     * @param {Response} res - Express Response object for sending the response.
     * @param {NextFunction} next - Express Next function for handling errors.
     * @returns {Promise<void>}
     */
    async deleteManyLabels(req, res, next) {
        try {
            const { ids } = req.body; // Extract an array of label IDs from the request body
            // Validate that each ID is a valid ObjectId
            if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
                throw new ErrorResponse(400, "Invalid label ID format.");
            }
            // Delete multiple labels by their IDs
            const deleteResults = await Label.deleteMany({ _id: { $in: ids } });
            if (deleteResults.deletedCount === 0) {
                throw new ErrorResponse(404, "Labels not found.");
            }
            res.status(204).json(); // Respond with no content for successful deletions
        }
        catch (error) {
            next(error);
        }
    }
    /**
    * Filter labels by their brands, products, variants, batch numbers, and created date.
    *
    * @param {Request} req - Express Request object containing the request data.
    * @param {Response} res - Express Response object for sending the response.
    * @param {NextFunction} next - Express Next function for handling errors.
    * @returns {Promise<void>}
    */
    async downloadCSV(req, res, next) {
        try {
            // Extract filter parameters from the request query
            const { brand_id, product_id, variant, batch_number, createdAt } = req.query;
            console.log(req.body);
            // Create a filter object to find labels for a specific date
            const filter = {
                user_id: req.account?._id,
                brand_id,
                product_id,
                variant,
                batch_number
            };
            if (createdAt) {
                // Assuming createdAt is a string in ISO format for the specific date
                const startDate = new Date(createdAt); // Get the start of the day
                startDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00
                const endDate = new Date(createdAt); // Get the end of the day
                endDate.setUTCHours(23, 59, 59, 999); // Set time to 23:59:59
                filter.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            // Query the database with the provided filter
            const labels = await Label.find(filter)
                .populate({
                path: 'manufacture_id', select: 'name', model: 'Manufacturer'
            }) // Populate 'name' field from manufacture_id
                .populate({
                path: 'brand_id', select: 'name', model: 'Brand'
            }) // Populate 'name' field from brand_id
                .populate({
                path: 'product_id', select: 'name', model: 'Product'
            });
            ;
            if (labels?.length === 0) {
                res.status(400).json({ success: false, message: "No Label Found!" });
                return;
            }
            const csvStream = csv.format({ headers: true });
            const writableStream = fs.createWriteStream('src/public/files/export/labels.csv');
            csvStream.pipe(writableStream);
            writableStream.on('finish', () => {
                res.status(200).json({
                    success: true,
                    downloadURL: 'files/export/labels.csv'
                });
            });
            const getObjectValue = (obj, key) => {
                return obj[key];
            };
            if (labels.length > 0) {
                labels.forEach((label) => {
                    csvStream.write({
                        manufacture: getObjectValue(label.manufacture_id, "name"),
                        brand: getObjectValue(label.brand_id, "name"),
                        product: getObjectValue(label.product_id, "name"),
                        Variant: label.variant,
                        PlantName: label.plant_name || '-',
                        BatchNumber: label.batch_number,
                        SerialNumber: label.serial_number.toString(),
                        TagNumber: label.tag_number,
                        TagActive: label.tag_active.toString(),
                        DS1: label.DS1.join(','),
                        DS2: label.DS2.join(','),
                        Status: label.status,
                        OwnerMobile: label.owner_mobile || '-',
                        CreatedAt: label.createdAt.toISOString(),
                    });
                });
            }
            csvStream.end();
            writableStream.end();
        }
        catch (error) {
            next(error);
        }
    }
}
/**
 * Generate a URL based on the provided parameters.
 *
 * @param {string} urlType - The type of URL to generate (e.g., 'DS1', 'DS2').
 * @param {string} brandName - The name of the brand.
 * @param {string} product_id - The product ID.
 * @param {string} batch_number - The batch number.
 * @param {number} index - The index for generating a unique URL.
 * @returns {string} - The generated URL.
 */
const generateURL = (urlType, brandName, product_id, batch_number, index) => {
    // Construct the URL based on the parameters
    let url = `${urlType}/${brandName.split(" ").join("_")}_${product_id}_${batch_number}_${index}`;
    return url;
};
export default new LabelController();
//# sourceMappingURL=label.controller.js.map