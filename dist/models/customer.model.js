import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please add a valid email'],
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: (props) => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: {
        type: Date,
        default: Date.now() + 3600000 // One hour from now
    },
    resetPasswordToken: String,
    resetPasswordTokenExpires: Date,
    image: String,
    city: String,
    address: String,
    country: String,
    status: {
        type: String,
        enum: ['active', 'blocked', 'other_status'],
        default: 'active'
    },
    joining_date: Date
}, { timestamps: true });
// Encrypt account password before saving to database
customerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});
// Match customer password with the stored hash
customerSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};
// Generate JWT token for customer
customerSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id }, config.jwt.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};
const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
//# sourceMappingURL=customer.model.js.map