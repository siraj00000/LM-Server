// Import the 'crypto' module for generating random bytes
import crypto from 'crypto';
// Function to generate a random password
function generatePassword(length = 12) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    const passwordArray = [];
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % characters.length;
        passwordArray.push(characters.charAt(randomIndex));
    }
    return passwordArray.join('');
}
export default generatePassword;
//# sourceMappingURL=password.utils.js.map