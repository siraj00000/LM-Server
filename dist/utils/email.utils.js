import nodemailer from 'nodemailer';
async function sendVerificationEmail(email, verificationLink) {
    try {
        // Create a transporter using your email service (e.g., Gmail)
        const transporter = nodemailer.createTransport({
            service: process.env.SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // Your email password
            },
            tls: {
                rejectUnauthorized: false // Bypass SSL verification
            }
        });
        // Define the email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Verification',
            html: `<p>Click the following link to verify your account:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
        };
        // Send the email
        const info = await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }
}
export default sendVerificationEmail;
//# sourceMappingURL=email.utils.js.map