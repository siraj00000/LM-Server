import json2csv from 'json2csv';
import { Document, Model } from 'mongoose';

// Custom type assertion function
function assertType<T>(value: any): T {
    return value as T;
}

// Export data in JSON format
export async function exportCollectionToJSON<T extends Document>(model: Model<T>): Promise<T[]> {
    const data = await model.find().lean().exec();
    return assertType<T[]>(data);
}

// Export data in CSV format
export async function exportCollectionToCSV<T extends Document>(model: Model<T>): Promise<string> {
    const data = await model.find().lean().exec();
    if (data.length === 0) {
        throw new Error('No data to export.');
    }

    // Define the fields to export based on the model's schema
    const fields = Object.keys(model.schema.paths);
    const csv = json2csv.parse(data, { fields });

    return csv;
}
