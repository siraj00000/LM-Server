import mongoose from 'mongoose';
const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Account' // Reference to the Account model
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpires: Date
}, { timestamps: true });
const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
//# sourceMappingURL=verification.model.js.map