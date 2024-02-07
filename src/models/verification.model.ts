import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVerification extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    verificationToken: string | undefined;
    verificationTokenExpires: Date | undefined;
    resetPasswordToken: string | undefined;
    resetPasswordTokenExpires: Date | undefined;
}

const verificationSchema: Schema<IVerification> = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Account' // Reference to the Account model
        },
        verificationToken: String,
        verificationTokenExpires: Date,
        resetPasswordToken: String,
        resetPasswordTokenExpires: Date
    },
    { timestamps: true }
);

const Verification: Model<IVerification> = mongoose.model<IVerification>('Verification', verificationSchema);

export default Verification;
