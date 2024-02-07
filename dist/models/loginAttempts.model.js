// loginAttempt.model.ts
import mongoose from 'mongoose';
const loginAttemptSchema = new mongoose.Schema({
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
}, { timestamps: true });
const LoginAttemptTracking = mongoose.model('LoginAttemptTracking', loginAttemptSchema);
export default LoginAttemptTracking;
//# sourceMappingURL=loginAttempts.model.js.map