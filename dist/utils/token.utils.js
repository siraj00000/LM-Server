import crypto from 'crypto';
function generateVerificationToken() {
    // Generate a random token using crypto
    const token = crypto.randomBytes(32).toString('hex');
    return token;
}
export default generateVerificationToken;
//# sourceMappingURL=token.utils.js.map