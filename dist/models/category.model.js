import mongoose from 'mongoose';
const categorySchema = new mongoose.Schema({
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
}, {
    timestamps: true
});
const Category = mongoose.model('Category', categorySchema);
export default Category;
//# sourceMappingURL=category.model.js.map