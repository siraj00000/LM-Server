import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILabel extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    createdAt: any;
    manufacture_id: mongoose.Schema.Types.ObjectId;
    brand_id: mongoose.Schema.Types.ObjectId;
    product_id: mongoose.Schema.Types.ObjectId;
    variant: string; // string
    plant_name: string | null;
    batch_number: string;
    serial_number: number;
    tag_number: string;
    tag_active: boolean;
    status: 'show' | 'hide';
    DS1: string[];
    DS2: string[];
    owner_mobile: string | null;
}

const labelSchema: Schema<ILabel> = new mongoose.Schema(
    {
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
            type: String, // it should be one
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
    },
    {
        timestamps: true,
    }
);

const Label: Model<ILabel> = mongoose.model<ILabel>('Label', labelSchema);

export default Label;
