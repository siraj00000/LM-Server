import mongoose from 'mongoose';
const errorReportSchema = new mongoose.Schema({
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Brand ID is required !!"],
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Product ID is required !!"],
    },
    store_and_location: {
        type: String,
        required: [true, "Store and Location is required !!"],
    },
    purchase_date: {
        type: String,
        required: [true, "Purchase date is required !!"],
    },
    store_pin_code: {
        type: String,
        required: [true, "Store pin code is required !!"],
    },
}, { timestamps: true });
const ErrorReport = mongoose.model('error_reports', errorReportSchema);
export default ErrorReport;
//# sourceMappingURL=ErrorReport.model.js.map