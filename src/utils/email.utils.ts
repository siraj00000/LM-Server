import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
    try {
        // Create a transporter using your email service (e.g., Gmail)
        const transporter: Transporter = nodemailer.createTransport({
            service: process.env.SERVICE, // Change this to your email service provider
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS // Your email password
            },
            tls: {
                rejectUnauthorized: false // Bypass SSL verification
            }
        });

        // Define the email content
        const mailOptions: SendMailOptions = {
            from: process.env.EMAIL_USER, // Sender email address
            to: email, // Recipient email address
            subject: 'Account Verification',    
            html: `<p>Click the following link to verify your account:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }
}

export default sendVerificationEmail;
