import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export interface IAccount extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    relatedWith: mongoose.Schema.Types.ObjectId;
    isVerified: boolean;
    image?: string;
    city?: string;
    address?: string;
    country?: string;
    status?: string;
    joining_date?: Date;
    associatedId?: mongoose.Schema.Types.ObjectId;
    matchPassword: (password: string) => Promise<boolean>;
    generateAuthToken: () => string;
}

const accountSchema: Schema<IAccount> = new mongoose.Schema(
    {
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
                validator: function (v: string) {
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
        role: {
            type: String,
            enum: ['Super Admin', 'Company Admin', 'Manufacturer Admin', 'User'],
            default: 'User'
        },
        relatedWith: {
            type: mongoose.Schema.Types.ObjectId,
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        image: String,
        city: String,
        address: String,
        country: String,
        status: {
            type: String,
            enum: ['active', 'blocked', 'other_status'],
            default: 'active'
        },
        associatedId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: function (this: IAccount) {
                if (this.role === 'Company Admin') {
                    return 'Company';
                } else if (this.role === 'Manufacturer Admin') {
                    return 'Manufacturer';
                }
                // Add more cases if you have other roles
                return undefined;
            },
            default: undefined
        },
        joining_date: Date,

    },
    { timestamps: true }
);

// Encrypt account password before saving to database
accountSchema.pre<IAccount>('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

// Match account password with stored hash
accountSchema.methods.matchPassword = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

// Generate JWT token for account
accountSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, config.jwt.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const Account: Model<IAccount> = mongoose.model<IAccount>('Account', accountSchema);

export default Account;
