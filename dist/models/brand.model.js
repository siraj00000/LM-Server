import mongoose from 'mongoose';
const brandSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Account'
    },
    company_id: {
        type: String,
        required: [true, "Company doesn't found"],
    },
    name: {
        type: String,
        required: [true, 'Please provide a brand name'],
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['show', 'hide'],
        default: "show",
        required: true
    },
    images: {
        type: [String],
        required: [true, 'Please upload at least one image'],
    },
    videoSource: {
        url: String,
        publicId: String
    } || null,
    videoURL: {
        type: String || null,
        default: null,
        trim: true
    },
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
    authentication_feature: {
        type: String,
        enum: ['Label', 'Batch', 'No feature'],
        default: "No feature",
    },
    warranty: {
        type: Boolean,
        default: false
    },
    request_help: {
        type: Boolean,
        default: false
    },
    survey_feature: {
        type: Boolean,
        default: false
    },
    survey_link: {
        type: String,
        default: null,
        trim: true
    },
    promo_code: {
        type: Boolean,
        default: false
    },
    referrals: {
        type: Boolean,
        default: false
    },
    re_order_link: {
        type: String,
        default: null,
        trim: true
    },
    email_support: {
        type: Boolean,
        default: false
    },
    email_id: {
        type: String,
        default: null,
    },
    call_support: {
        type: Boolean,
        default: false
    },
    call_no: {
        type: String,
        trim: true,
        default: null
    },
    whatsapp_support: {
        type: Boolean,
        default: false
    },
    whatsapp_number: {
        type: String,
        trim: true,
        default: null
    },
    instagram: {
        type: Boolean,
        default: false
    },
    insta_link: {
        type: String,
        default: null,
        trim: true
    },
    facebook: {
        type: Boolean,
        default: false
    },
    fb_link: {
        type: String,
        default: null,
        trim: true
    },
}, {
    timestamps: true
});
const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
//# sourceMappingURL=brand.model.js.map