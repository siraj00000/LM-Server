import mongoose from 'mongoose';
const labelSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Account'
    },
    manufacture_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Manufacturer does not found !!"],
    },
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Brand does not found !!"],
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Product does not found !!"],
    },
    variant: {
        type: String,
        required: [true, "Product variant does not found !!"],
    },
    plant_name: {
        type: String,
        default: null,
    },
    batch_number: {
        type: String,
        required: [true, "Batch number does not found !!"],
    },
    serial_number: {
        type: Number,
        required: [true, "Serial number does not found !!"],
    },
    tag_number: {
        type: String,
        required: [false, "Tag number does not found !!"],
    },
    tag_active: {
        type: Boolean,
        default: false,
    },
    DS1: {
        type: [String],
        required: [true, "DS1 does not found !!"],
    },
    DS2: {
        type: [String],
        required: [true, "DS1 does not found !!"],
    },
    status: {
        type: String,
        enum: ['show', 'hide'],
        default: 'show'
    },
    owner_mobile: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
const Label = mongoose.model('Label', labelSchema);
export default Label;
//# sourceMappingURL=label.model.js.map