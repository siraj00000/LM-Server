import express from 'express';
import AccountController from '../controllers/account.controller.js';
import { protectMiddleware } from '../middleware/protect.middleware.js';
import authAdmin from '../middleware/auth_admin.middleware.js';
import { upload } from '../middleware/upload_file.middleware.js';
const router = express.Router();
router
    // Register a new account and send a verification email
    .post('/register', AccountController.createAccount)
    // Verify an account using a verification token
    .post('/verify', AccountController.verifyAccount)
    // Login to an account
    .post('/login', AccountController.accountLogin)
    // Forget Password: Initiate the password reset process
    .post('/verify', AccountController.verifyAccount)
    // Forget Password: Initiate the password reset process
    .post('/forgot-password', AccountController.forgotPassword)
    // Reset Password: Handle password reset with a token
    .post('/reset-password', AccountController.resetPassword)
    // Get user: Handle fetch user accounts except the super admin's info
    .get('/getAllAccounts', protectMiddleware, authAdmin, AccountController.getAllAccounts)
    // Update user: Handle user info updation
    .put('/update-user/:id', protectMiddleware, upload.single('image'), AccountController.updateUser)
    // Create Staff: Only super admin can operate
    .post('/create-staff', protectMiddleware, authAdmin, upload.single('image'), AccountController.createStaffAccount)
    // Create Staff: Only super admin can operate
    .post('/unblock-user/:id', protectMiddleware, authAdmin, AccountController.unblockUserAndSendPassword)
    // Delete Staff Account: Only super admin can operate and can't delete itself
    .delete('/deleteOne/:id', protectMiddleware, authAdmin, AccountController.deleteOneAccount)
    // Delete Staff Accounts: Only super admin can operate and can't delete itself
    .delete('/deleteMany', protectMiddleware, authAdmin, AccountController.unblockUserAndSendPassword);
export default router;
//# sourceMappingURL=account.router.js.map