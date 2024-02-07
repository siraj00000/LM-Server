import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBrand extends Document {
    company_id: string;
    user_id: mongoose.Schema.Types.ObjectId;
    name: string;
    status: 'show' | 'hide';
    images: string[] | null;
    videoSource: {
        url: string,
        publicId: string
    } | null;
    videoURL: string | null;
    carousel_headings: string[] | null;
    carousel_text: string[] | null;
    product_description: string | null;
    authentication_feature: 'Label' | 'Batch' | 'No feature';
    warranty: boolean;
    request_help: boolean;
    survey_feature: boolean;
    survey_link: string | null;
    promo_code: boolean;
    referrals: boolean;
    re_order_link: string | null;
    email_support: boolean;
    email_id: string | null;
    call_support: boolean;
    call_no: string | null;
    whatsapp_support: boolean;
    whatsapp_number: string | null;
    instagram: boolean;
    insta_link: string | null;
    facebook: boolean;
    fb_link: string | null;
}

const brandSchema: Schema<IBrand> = new mongoose.Schema(
    {
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
    },
    {
        timestamps: true
    }
);

const Brand: Model<IBrand> = mongoose.model<IBrand>('Brand', brandSchema);

export default Brand;