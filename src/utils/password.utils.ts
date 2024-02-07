// Import the 'crypto' module for generating random bytes
import crypto from 'crypto';

// Function to generate a random password
function generatePassword(length: number = 12): string {
    const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    const passwordArray: string[] = [];
    const randomBytes: Buffer = crypto.randomBytes(length);

    for (let i: number = 0; i < length; i++) {
        const randomIndex: number = randomBytes[i] % characters.length;
        passwordArray.push(characters.charAt(randomIndex));
    }

    return passwordArray.join('');
}

export default generatePassword;
