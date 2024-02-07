import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICategory extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    title: string;
    description?: string;
    status: 'show' | 'hide';
}

const categorySchema: Schema<ICategory> = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'Account'
        },
        title: {
            type: String,
            required: [true, "Please Provide category title"],
            trim: true,
            unique: true
        },
        description: {
            type: String,
            maxlength: 50
        },
        status: {
            type: String,
            lowercase: true,
            enum: ['show', 'hide'],
            default: 'show'
        }
    },
    {
        timestamps: true
    }
);

const Category: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
