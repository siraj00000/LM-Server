import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide the product'],
        unique: true,
        trim: true,
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please select company'],
        ref: 'Company'
    },
    variant_type: {
        type: String,
        required: [true, 'Please provide a variant type'],
        trim: true,
    },
    variants: {
        type: [String],
        default: null,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Account'
    },
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Brand'
    },
    sub_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Subcategory'
    },
    images: {
        type: [String],
        default: null,
    },
    video_url: {
        url: String,
        publicId: String,
    } || null,
    carousel_headings: {
        type: [String],
        default: null,
    },
    carousel_text: {
        type: [String],
        default: null,
    },
    product_description: {
        type: String,
        default: null,
    },
    service_feature: {
        type: Boolean,
        default: null,
    },
    general_warranty_duration: {
        type: String,
        default: null,
    },
    special_warranty_type: {
        type: String,
        default: null,
    },
    special_warranty_duration: {
        type: String,
        default: null,
    },
    free_brand_maintenance_duration: {
        type: String,
        default: null,
    },
    one_click_reorder_feature: {
        type: Boolean,
        default: false,
    },
    reorder_link: {
        type: String,
        default: null,
    },
    survey_feature: {
        type: Boolean,
        default: false,
    },
    survey_link: {
        type: String,
        default: null,
    },
    feature: {
        type: Map
    },
    status: {
        type: String,
        enum: ['show', 'hide'],
        default: "show",
        required: true
    },
}, {
    timestamps: true,
});
const Product = mongoose.model('Product', productSchema);
export default Product;
//# sourceMappingURL=product.model.js.map