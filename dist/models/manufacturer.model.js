import mongoose from 'mongoose';
const manufacturerAdminSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Account'
    },
    email: {
        type: String,
        required: [true, 'Please provide a company email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill a valid email address'
        ]
    },
    name: {
        type: String,
        required: [true, 'Please provide a manufacturer name'],
        trim: true,
        unique: true
    },
    company_id: {
        type: String,
        required: [true, "Company doesn't found"],
    },
    pincode: {
        type: Number,
        required: [true, "Please provide a pincode"],
        minlength: 5
    },
    registered_address: {
        type: String,
        default: null
    },
    phone_one: {
        type: Number,
        trim: true,
        default: null
    },
    phone_two: {
        type: Number,
        trim: true,
        default: null
    },
    status: {
        type: String,
        lowercase: true,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});
const Manufacturer = mongoose.model('Manufacturer', manufacturerAdminSchema);
export default Manufacturer;
//# sourceMappingURL=manufacturer.model.js.map