import mongoose from 'mongoose';
const warrantyRegistrationSchema = new mongoose.Schema({
    DS1: {
        type: String,
        required: [true, "Unable to find the label !!"],
        unique: true,
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Invalid Company Info!'],
    },
    warranty_activated: {
        type: Boolean,
        required: [true, 'Warranty activation status is required.']
    },
    purchase_date: {
        type: String,
        required: [true, 'Purchase date is required.']
    },
    store_name: {
        type: String,
        required: [true, 'Store name is required.']
    },
    store_pin_code: {
        type: String,
        unique: true,
        required: [true, 'Store pin code is required.']
    },
    warranty_duration: {
        type: String,
        required: [true, 'Warranty duration is required.']
    },
    invoice_number: {
        type: String,
        required: [true, 'Invoice number is required.']
    },
    invoice_image: {
        type: String,
        required: [true, 'Invoice image URL is required.']
    },
    pincode: {
        type: String,
        required: [true, 'Pin code is required.']
    },
    address1: {
        type: String,
        required: [true, "Please provide your store address."],
    },
    address2: {
        type: String,
    },
}, {
    timestamps: true
});
const Warranty = mongoose.model('warranty', warrantyRegistrationSchema);
export default Warranty;
//# sourceMappingURL=warranty.model.js.map