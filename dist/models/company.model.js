import mongoose from 'mongoose';
const companySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Account'
    },
    email: {
        type: String,
        required: [true, 'Please provide a company email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill a valid email address'
        ]
    },
    name: {
        type: String,
        required: [true, 'Please provide a company name'],
        trim: true
    },
    pincode: {
        type: Number,
        required: [true, 'Please provide a pincode'],
        minlength: 5
    },
    registered_address: {
        type: String,
        default: null
    },
    phone_one: {
        type: Number,
        trim: true,
        default: null,
        minlength: 10
    },
    phone_two: {
        type: Number,
        trim: true,
        default: null,
        minlength: 10
    },
    status: {
        type: String,
        default: 'show',
        enum: ['show', 'hide'],
        lowercase: true
    },
    estaiblishment_year: {
        type: Date,
        required: [true, 'Please provide company year of establishment']
    },
    sub_category: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'subcategories',
        required: [true, "Please provide sub category"]
    }
}, {
    timestamps: true
});
const Company = mongoose.model('Company', companySchema);
export default Company;
//# sourceMappingURL=company.model.js.map