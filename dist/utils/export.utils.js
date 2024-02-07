import json2csv from 'json2csv';
// Custom type assertion function
function assertType(value) {
    return value;
}
// Export data in JSON format
export async function exportCollectionToJSON(model) {
    const data = await model.find().lean().exec();
    return assertType(data);
}
// Export data in CSV format
export async function exportCollectionToCSV(model) {
    const data = await model.find().lean().exec();
    if (data.length === 0) {
        throw new Error('No data to export.');
    }
    // Define the fields to export based on the model's schema
    const fields = Object.keys(model.schema.paths);
    const csv = json2csv.parse(data, { fields });
    return csv;
}
//# sourceMappingURL=export.utils.js.map