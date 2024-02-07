import mongoose from 'mongoose';
const subcategorySchema = new mongoose.Schema({
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
        ref: 'Category',
        required: [true, "Please provide parent category"],
    },
    features: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
const Subcategory = mongoose.model('Subcategory', subcategorySchema);
export default Subcategory;
//# sourceMappingURL=subCategory.model.js.map