// loginAttempt.model.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILoginAttemptTracking extends Document {
    accountId: Schema.Types.ObjectId;
    loginAttemptCount: number;
    lastFailedAttemptTime: Date | null;
}

const loginAttemptSchema: Schema<ILoginAttemptTracking> = new mongoose.Schema(
    {
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Account' // Reference to the Account model
        },
        loginAttemptCount: {
            type: Number,
            default: 0
        },
        lastFailedAttemptTime: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const LoginAttemptTracking: Model<ILoginAttemptTracking> = mongoose.model<ILoginAttemptTracking>('LoginAttemptTracking', loginAttemptSchema);

export default LoginAttemptTracking;
