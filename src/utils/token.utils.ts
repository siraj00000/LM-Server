import crypto from 'crypto';

function generateVerificationToken(): string {
    // Generate a random token using crypto
    const token = crypto.randomBytes(32).toString('hex');
    return token;
}

export default generateVerificationToken;
