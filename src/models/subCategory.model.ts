import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubcategory extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    title: string;
    status: 'show' | 'hide';
    parent_category_id: mongoose.Schema.Types.ObjectId; // Reference to the parent category
    features: string[];
}

const subcategorySchema: Schema<ISubcategory> = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'Account'
        },
        title: {
            type: String,
            required: [true, "Please provide subcategory title"],
            trim: true,
            unique: true,
        },
        status: {
            type: String,
            lowercase: true,
            enum: ['show', 'hide'],
            default: 'show',
        },
        parent_category_id: {
            type: mongoose.Types.ObjectId,
            ref: 'Category', // Reference to the parent category model
            required: [true, "Please provide parent category"],
        },
        features: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Subcategory: Model<ISubcategory> = mongoose.model<ISubcategory>('Subcategory', subcategorySchema);

export default Subcategory;
