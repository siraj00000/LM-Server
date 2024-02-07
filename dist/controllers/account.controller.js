// Import the 'Account' model representing user accounts
import Account from '../models/accounts.model.js';
// Import the 'LoginAttemptTracking' model representing user login attempts tracking
import LoginAttemptTracking from '../models/loginAttempts.model.js';
// Import a custom error response utility class
import { ErrorResponse } from '../utils/error_response.utils.js';
// Import a utility function for sending verification emails
import sendVerificationEmail from '../utils/email.utils.js';
// Import Cloudinary Package from cloudinary
import cloudinary from 'cloudinary';
// Import a utility function for generating verification tokens
import generateVerificationToken from '../utils/token.utils.js'; // Import for generating verification tokens
// Import a utility function for generating random passwords
import generatePassword from '../utils/password.utils.js'; // Import for generating random passwords
// Import a utility function for validating MIME types of uploaded files
import { validateMimeType } from '../utils/validate_mimetype.utils.js'; // Import for MIME type validation
// Import a utility function for removing temporary files or folders
import { removeTmp } from '../utils/remove_folder.utils.js'; // Import for removing temporary files or folders
import Verification from '../models/verification.model.js';
class AccountController {
    // Method for login into an account with a email and password
    async accountLogin(req, res, next) {
        try {
            // Extract email and password from the request body
            const { email, password } = req.body;
            // Check if both email and password are provided
            if (!email || !password)
                return next(new ErrorResponse(401, 'Please provide email and password.'));
            // Find the user account by email and include the password field for comparison
            const account = await Account.findOne({ email }).select('+password');
            // If the account doesn't exist, return an error
            if (!account)
                return next(new ErrorResponse(401, 'Invalid Credentials.'));
            // Check if the account is not verified
            if (!account.isVerified) {
                return next(new ErrorResponse(401, 'Your account is not verified.'));
            }
            // Check if the account is blocked
            if (account.status === 'blocked') {
                return next(new ErrorResponse(401, 'Your account is blocked.'));
            }
            // Find or create a login attempt tracking record for this account
            let loginAttempt = await LoginAttemptTracking.findOne({ accountId: account._id });
            if (!loginAttempt) {
                loginAttempt = new LoginAttemptTracking({ accountId: account._id });
            }
            // Check if the user is still within the 30-second waiting period
            const currentTime = new Date();
            if (loginAttempt.loginAttemptCount >= 5) {
                if (loginAttempt.lastFailedAttemptTime && currentTime.getTime() - loginAttempt.lastFailedAttemptTime.getTime() < 30000) {
                    // Calculate the remaining time in seconds
                    const remainingTimeInSeconds = Math.ceil((loginAttempt.lastFailedAttemptTime.getTime() - currentTime.getTime() + 30000) / 1000);
                    return next(new ErrorResponse(401, `Too many failed attempts. Please wait for ${remainingTimeInSeconds} seconds.`));
                }
                // Reset lastFailedAttemptTime since the user exceeded the 30-second period
                loginAttempt.lastFailedAttemptTime = null;
            }
            // Check if the provided password matches the stored password for the account
            const isMatch = await account.matchPassword(password);
            // If the passwords don't match, increment login attempt count and check for blocking
            if (!isMatch) {
                loginAttempt.loginAttemptCount += 1;
                if (loginAttempt.loginAttemptCount === 5) {
                    // Set lastFailedAttemptTime to current time + 30 seconds
                    loginAttempt.lastFailedAttemptTime = new Date(currentTime.getTime() + 30000);
                }
                else if (loginAttempt.loginAttemptCount >= 6) {
                    // Check if the user needs to wait 30 seconds
                    if (loginAttempt.lastFailedAttemptTime && currentTime.getTime() - loginAttempt.lastFailedAttemptTime.getTime() < 30000) {
                        // Calculate the remaining time in seconds
                        const remainingTimeInSeconds = Math.ceil((loginAttempt.lastFailedAttemptTime.getTime() - currentTime.getTime() + 30000) / 1000);
                        return next(new ErrorResponse(401, `Too many failed attempts. Please wait for ${remainingTimeInSeconds} seconds.`));
                    }
                    // Reset lastFailedAttemptTime since the user exceeded the 30-second period
                    loginAttempt.lastFailedAttemptTime = null;
                }
                if (loginAttempt.loginAttemptCount >= 8) {
                    // Block the account
                    account.status = 'blocked';
                }
                await Promise.all([loginAttempt.save(), account.save()]);
                return next(new ErrorResponse(401, 'Invalid Credentials.'));
            }
            // If the login is successful, remove the login attempt tracking record
            await LoginAttemptTracking.findOneAndRemove({ accountId: account._id }).exec();
            // Generate an authentication token for the user
            const token = account.generateAuthToken();
            // Create an accountInfo object with the user's role
            let accountInfo = { role: account.role };
            // Respond with a success status, the authentication token, and account information
            res.status(200).json({ success: true, token, accountInfo });
        }
        catch (error) {
            // Handle any errors that occur during the authentication process
            next(error);
        }
    }
    // Method for creating a new user account with a verification token
    async createAccount(req, res, next) {
        try {
            // Extract user account information from the request body
            const accountInfo = req.body;
            // Generate a unique verification token (consider using a crypto library)
            const verificationToken = generateVerificationToken();
            // Set the expiration time for the verification token (e.g., one hour from now)
            const verificationTokenExpires = new Date(Date.now() + 3600000);
            // Create the user account with the provided information and verification attributes
            let account = await Account.create(accountInfo);
            // Add the generated verification token and expiration to the user verification collection with user's id
            await Verification.create({
                userId: account?._id,
                verificationToken,
                verificationTokenExpires
            });
            // Generate a verification link using the admin URL and the user's email and token
            const verificationLink = `${process.env.ADMIN_URL}/verify/${account.email}/${verificationToken}`;
            const emailTemplate = `
                <html>
                <body>
                    <h1>Welcome to Label Makers</h1>
                    <p>Your staff account has been created.</p>
                    <p>Please verify your email address by clicking the following link:</p>
                    <a href="${verificationLink}">Verify Your Email</a>
                </body>
                </html>`;
            // Send a verification email to the user with the generated verification link
            await sendVerificationEmail(account.email, emailTemplate);
            // Respond with a success status and a message instructing the user to check their email
            res.status(201).json({
                success: true,
                message: 'Your account has been successfully registered! Please check your email for a verification link.'
            });
        }
        catch (error) {
            // Handle any errors that may occur during account creation or email sending
            next(error);
        }
    }
    // Method for verifying a user account using the provided email and verification token
    async verifyAccount(req, res, next) {
        try {
            // Extract email and token from the query parameters
            const { email, token } = req.query;
            // Find the user account by email
            const account = await Account.findOne({ email });
            // Find user verification information with the user's id if the account exists
            const userVerificationData = await Verification.findOne({ userId: account?._id });
            // Check if the account doesn't exist or the provided token doesn't match
            if (!account || !userVerificationData || (account && userVerificationData?.verificationToken !== token)) {
                // Return an error response if the account is not found or the token is incorrect
                return next(new ErrorResponse(404, `Sorry, we couldn't find your account. Please double-check your information and try again.`));
            }
            // Check if the verification token has expired
            if (userVerificationData.verificationTokenExpires < new Date()) {
                // Return an error response if the token has expired
                return next(new ErrorResponse(401, 'Oops! It looks like your verification token has expired. Please request a new one.'));
            }
            // Update the user account to mark it as verified and clear the token and expiration
            account.isVerified = true;
            userVerificationData.verificationToken = undefined;
            userVerificationData.verificationTokenExpires = undefined;
            const [updateAccount, updateAccountVerification] = await Promise.all([
                account.save(),
                userVerificationData.save()
            ]);
            if (updateAccount && updateAccountVerification) {
                // Respond with a success status and a message indicating successful verification
                res.status(200).json({
                    success: true,
                    msg: 'Congratulations! Your account has been successfully verified!'
                });
            }
        }
        catch (error) {
            // Handle any errors that may occur during the verification process
            next(error);
        }
    }
    // Method for initiating the "Forget Password" process
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            // Find the user account by email
            const account = await Account.findOne({ email });
            // Find the user account verification data by account _id
            const userVerificationData = await Verification.findOne({ userId: account?._id });
            // If the account doesn't exist, return an error
            if (!account || !userVerificationData)
                return next(new ErrorResponse(404, 'Account not found.'));
            // Generate a unique reset password token (consider using a crypto library)
            const resetPasswordToken = generateVerificationToken();
            // Set the expiration time for the reset password token (e.g., one hour from now)
            const resetPasswordTokenExpires = new Date(Date.now() + 3600000);
            // Update the user account with the reset password token and expiration
            userVerificationData.resetPasswordToken = resetPasswordToken;
            userVerificationData.resetPasswordTokenExpires = resetPasswordTokenExpires;
            await Promise.all([
                account.save(),
                userVerificationData.save()
            ]);
            // Generate a reset password link using the admin URL and the reset password token
            const resetPasswordLink = `${process.env.ADMIN_URL}/reset-password/${resetPasswordToken}`;
            // Create a template for the reset password email
            const emailTemplate = `
                    <html>
                    <body>
                        <h1>Reset Your Password</h1>
                        <p>You have requested to reset your password.</p>
                        <p>Please click the following link to reset your password:</p>
                        <a href="${resetPasswordLink}">Reset Password</a>
                        <p>If you did not request a password reset, you can ignore this email.</p>
                    </body>
                    </html>
                    `;
            // Send the reset password email using your sendVerificationEmail function
            await sendVerificationEmail(account.email, emailTemplate);
            // Respond with a success status and a message instructing the user to check their email
            res.status(200).json({
                success: true,
                message: 'Password reset instructions sent to your email.'
            });
        }
        catch (error) {
            // Handle any errors that may occur during the "Forget Password" process
            next(error);
        }
    }
    // Method for resetting the user's password
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            // Find the user verification by the reset password token
            const userVerificationData = await Verification.findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpires: { $gte: new Date() } // Check if the token is still valid
            });
            // Find the user account by the reset password token
            const account = await Account.findOne({ _id: userVerificationData?.userId });
            // If the account doesn't exist or the token is invalid/expired, return an error
            if (!account || !userVerificationData)
                return next(new ErrorResponse(400, 'Invalid or expired reset password token.'));
            // Set the new password and clear the reset password token and expiration
            account.password = newPassword;
            userVerificationData.resetPasswordToken = undefined;
            userVerificationData.resetPasswordTokenExpires = undefined;
            await Promise.all([
                account.save(),
                userVerificationData.save()
            ]);
            // Respond with a success status and a message indicating successful password reset
            res.status(200).json({
                success: true,
                message: 'Your password has been successfully reset.'
            });
        }
        catch (error) {
            // Handle any errors that may occur during the password reset process
            next(error);
        }
    }
    // Method for creating a new staff account with a generated password
    async createStaffAccount(req, res, next) {
        try {
            // Extract staff account information from the request body
            const staffInfo = req.body;
            // Check if an image file was uploaded
            if (req.file) {
                // Validate the image file type (e.g., check mime type)
                let isValidFile = validateMimeType(req.file); // Implement your validation function
                if (!isValidFile)
                    throw new ErrorResponse(400, 'Invalid image type');
                // Upload the image to Cloudinary
                const result = await cloudinary.v2.uploader.upload(req.file.path, { folder: 'staff-profiles' });
                // Remove the temporary image file
                removeTmp(req.file.path); // Implement your function to remove temporary files
                staffInfo.image = result.secure_url; // Set the image URL to the Cloudinary secure URL
            }
            // Generate a unique password for the staff member
            const generatedPassword = generatePassword(); // Implement a function to generate a password
            // Set the status for the staff account (e.g., 'active')
            staffInfo.status = 'active';
            // Generate a unique verification token (consider using a crypto library)
            const verificationToken = generateVerificationToken();
            // Set the expiration time for the verification token (e.g., one hour from now)
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            // Add the generated password and image URL to the staff account information
            staffInfo.password = generatedPassword;
            // Create the staff account with the provided information
            const staffAccount = await Account.create(staffInfo);
            // Create the staff account verification data with the _id 
            await Verification.create({
                userId: staffAccount?._id,
                verificationToken,
                verificationTokenExpires
            });
            // Send the generated password to the staff member via email
            // Create a template for the email message
            const verificationLink = `${process.env.ADMIN_URL}/verify/${staffAccount.email}/${verificationToken}`;
            const emailTemplate = `
                    <html>
                    <body>
                        <h1>Welcome to Label Makers</h1>
                        <p>Your staff account has been created.</p>
                        <p>Your password is: ${generatedPassword}</p>
                        <p>Please verify your email address by clicking the following link:</p>
                        <a href="${verificationLink}">Verify Your Email</a>
                    </body>
                    </html>`;
            await sendVerificationEmail(staffAccount.email, emailTemplate);
            // Respond with a success status and a message indicating the password has been sent
            res.status(201).json({
                success: true,
                message: 'Staff account created. Password has been sent to the email address.'
            });
        }
        catch (error) {
            // Handle any errors that may occur during staff account creation, image upload, or email sending
            next(error);
        }
    }
    // Method for updating user information, including image upload
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const userInfo = req.body;
            // Check if the user exists
            const user = await Account.findById(id);
            if (!user) {
                return next(new ErrorResponse(404, 'User not found.'));
            }
            // Remove old image from Cloudinary if a new image is uploaded
            if (req.file) {
                const isValidFile = validateMimeType(req.file);
                if (!isValidFile) {
                    removeTmp(req.file.path);
                    return next(new ErrorResponse(400, 'Invalid image type.'));
                }
                if (user.image) {
                    // Remove old image from Cloudinary
                    await cloudinary.v2.uploader.destroy(user.image);
                }
                const result = await cloudinary.v2.uploader.upload(req.file.path, { folder: 'staff-profiles' });
                userInfo.image = result.secure_url;
                removeTmp(req.file.path);
            }
            // Update user information except for restricted fields
            delete userInfo.role;
            delete userInfo.isVerified;
            delete userInfo.verificationToken;
            delete userInfo.verificationTokenExpires;
            delete userInfo.resetPasswordToken;
            delete userInfo.resetPasswordTokenExpires;
            const updatedUser = await Account.findByIdAndUpdate(id, userInfo, {
                new: true,
                runValidators: true
            });
            res.status(200).json({ success: true, data: updatedUser });
        }
        catch (error) {
            next(error);
        }
    }
    // Method for admin to unblock a user and send a new password via email
    async getAllAccounts(req, res, next) {
        try {
            // Define pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            // Define sorting options
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = (req.query.sortOrder || 'asc') === 'desc' ? 'desc' : 'asc';
            // Build the filter object to exclude "Super Admin" accounts
            const filter = { role: { $ne: 'Super Admin' } };
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            // Define sort object for MongoDB
            const sort = {};
            sort[sortBy] = sortOrder;
            // Query the database with pagination, sorting, and filtering
            const accounts = await Account.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit);
            // Calculate the total count of matching accounts (for pagination)
            const totalCount = await Account.countDocuments(filter);
            // Respond with the paginated and sorted accounts
            res.status(200).json({
                success: true,
                data: accounts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            });
        }
        catch (error) {
            // Handle any errors that may occur during account retrieval
            next(error);
        }
    }
    // Method for admin to unblock a user and send a new password via email
    async unblockUserAndSendPassword(req, res, next) {
        try {
            const { id } = req.params;
            // Check if the user exists and is blocked
            const user = await Account.findById(id);
            if (!user) {
                return next(new ErrorResponse(404, 'User not found.'));
            }
            if (user.status !== 'blocked') {
                return next(new ErrorResponse(400, 'User is not blocked.'));
            }
            // Remove the loginAttemptTracking record if it exists
            await LoginAttemptTracking.findOneAndRemove({ accountId: user._id }).exec();
            // Generate a new password for the user
            const generatedPassword = generatePassword();
            // Update the user's password and unblock them
            user.password = generatedPassword;
            user.status = 'active';
            await user.save();
            // Send the new password to the user via email
            const emailMessage = `Your account has been unblocked. Your new password is: ${generatedPassword}`;
            await sendVerificationEmail(user.email, emailMessage);
            res.status(200).json({ success: true, message: 'User unblocked, and new password sent.' });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteOneAccount(req, res, next) {
        try {
            const { id } = req.params;
            // Find the account by ID
            const account = await Account.findById(id);
            if (!account) {
                throw new ErrorResponse(404, 'Account not found.');
            }
            // Check if the account has the "Super Admin" role
            if (account.role === 'Super Admin') {
                throw new ErrorResponse(403, 'Super Admin accounts cannot be deleted.');
            }
            // Delete the account
            await Account.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Account deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteManyAccount(req, res, next) {
        try {
            const { ids } = req.body;
            // Check if the IDs array is empty
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new ErrorResponse(403, 'Invalid or empty list of account IDs.');
            }
            // Find accounts by IDs
            const accounts = await Account.find({ _id: { $in: ids } });
            // Filter out Super Admin accounts
            const nonSuperAdminAccounts = accounts.filter(account => account.role !== 'Super Admin');
            // Extract IDs of non-Super Admin accounts
            const nonSuperAdminAccountIds = nonSuperAdminAccounts.map(account => account._id.toString());
            // Delete the non-Super Admin accounts
            await Account.deleteMany({ _id: { $in: nonSuperAdminAccountIds } });
            res.status(200).json({ success: true, message: 'Accounts deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new AccountController();
//# sourceMappingURL=account.controller.js.map