import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../utils/error_response.utils.js';
import Customer, { ICustomer } from '../models/customer.model.js';
import generateVerificationToken from '../utils/token.utils.js';
import sendVerificationEmail from '../utils/email.utils.js';

class CustomerController {
    // Method for authenticating and generating an authentication token for the customer
    public async customerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract email and password from the request body
            const { email, password } = req.body;

            // Check if both email and password are provided
            if (!email || !password) return next(new ErrorResponse(401, 'Please provide email and password.'));

            // Find the customer by email and include the password field for comparison
            const customer = await Customer.findOne({ email }).select('+password');

            // If the customer doesn't exist, return an error
            if (!customer) return next(new ErrorResponse(401, 'Invalid Credentials.'));

            // Check if the provided password matches the stored password for the customer
            const isMatch = await customer.matchPassword(password);

            // If the passwords don't match, return an error
            if (!isMatch) return next(new ErrorResponse(401, 'Invalid Credentials.'));

            // Generate an authentication token for the customer
            const token = customer.generateAuthToken();

            // Create a customerInfo object with customer data
            const customerInfo = {
                _id: customer._id,
                name: customer.name,
                email: customer.email
            };

            // Respond with a success status, the authentication token, and customer information
            res.status(200).json({ success: true, token, customerInfo });
        } catch (error) {
            // Handle any errors that occur during the authentication process
            next(error);
        }
    }

    // Method for creating a new customer account with a verification token
    public async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract customer account information from the request body
            const customerInfo: ICustomer = req.body;

            // Generate a unique verification token (consider using a crypto library)
            const verificationToken = generateVerificationToken();

            // Set the expiration time for the verification token (e.g., one hour from now)
            const verificationTokenExpires = new Date(Date.now() + 3600000);

            // Add the generated verification token and expiration to the customer account information
            customerInfo.verificationToken = verificationToken;
            customerInfo.verificationTokenExpires = verificationTokenExpires;

            // Create the customer account with the provided information and verification attributes
            const customer = await Customer.create(customerInfo);

            // Generate a verification link using the customer URL and the customer's email and token
            const verificationLink = `${process.env.CUSTOMER_URL}/verify/${customer.email}/${verificationToken}`;

            // Send a verification email to the customer with the generated verification link
            await sendVerificationEmail(customer.email, verificationLink);

            // Respond with a success status and a message instructing the customer to check their email
            res.status(201).json({
                success: true,
                message: 'Your account has been successfully registered! Please check your email for a verification link.'
            });
        } catch (error) {
            // Handle any errors that may occur during account creation or email sending
            next(error);
        }
    }

    // Method for verifying a customer account using the provided email and verification token
    public async verifyCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract email and token from the query parameters
            const { email, token } = req.query;

            // Find the customer account by email
            const customer = await Customer.findOne({ email });

            // Check if the customer doesn't exist or the provided token doesn't match
            if (!customer || (customer && customer?.verificationToken !== token)) {
                // Return an error response if the customer is not found or the token is incorrect
                return next(new ErrorResponse(404, `Sorry, we couldn't find your account. Please double-check your information and try again.`));
            }

            // Check if the verification token has expired
            if (customer.verificationTokenExpires! < new Date()) {
                // Return an error response if the token has expired
                return next(new ErrorResponse(401, 'Oops! It looks like your verification token has expired. Please request a new one.'));
            }

            // Update the customer account to mark it as verified and clear the token and expiration
            customer.isVerified = true;
            customer.verificationToken = undefined;
            customer.verificationTokenExpires = undefined;
            await customer.save();

            // Respond with a success status and a message indicating successful verification
            res.status(200).json({
                success: true,
                msg: 'Congratulations! Your account has been successfully verified!'
            });
        } catch (error) {
            // Handle any errors that may occur during the verification process
            next(error);
        }
    }

    // Method for initiating the "Forget Password" process
    public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;

            // Find the customer account by email
            const customer = await Customer.findOne({ email });

            // If the customer doesn't exist, return an error
            if (!customer) return next(new ErrorResponse(404, 'Account not found.'));

            // Generate a unique reset password token (consider using a crypto library)
            const resetPasswordToken = generateVerificationToken();

            // Set the expiration time for the reset password token (e.g., one hour from now)
            const resetPasswordTokenExpires = new Date(Date.now() + 3600000);

            // Update the customer account with the reset password token and expiration
            customer.resetPasswordToken = resetPasswordToken;
            customer.resetPasswordTokenExpires = resetPasswordTokenExpires;
            await customer.save();

            // Generate a reset password link using the customer URL and the reset password token
            const resetPasswordLink = `${process.env.CUSTOMER_URL}/reset-password/${resetPasswordToken}`;

            // Send a reset password email to the customer with the generated link
            await sendVerificationEmail(customer.email, resetPasswordLink);

            // Respond with a success status and a message instructing the customer to check their email
            res.status(200).json({
                success: true,
                message: 'Password reset instructions have been sent to your email. Please follow the link to reset your password.'
            });
        } catch (error) {
            // Handle any errors that may occur during the "Forget Password" process
            next(error);
        }
    }

    // Method for resetting the customer's password
    public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword } = req.body;

            // Find the customer account by the reset password token
            const customer = await Customer.findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpires: { $gte: new Date() } // Check if the token is still valid
            });

            // If the customer doesn't exist or the token is invalid/expired, return an error
            if (!customer) return next(new ErrorResponse(400, 'Invalid or expired reset password token.'));

            // Set the new password and clear the reset password token and expiration
            customer.password = newPassword;
            customer.resetPasswordToken = undefined;
            customer.resetPasswordTokenExpires = undefined;
            await customer.save();

            // Respond with a success status and a message indicating successful password reset
            res.status(200).json({
                success: true,
                message: 'Your password has been successfully reset.'
            });
        } catch (error) {
            // Handle any errors that may occur during the password reset process
            next(error);
        }
    }
}

export default new CustomerController();
