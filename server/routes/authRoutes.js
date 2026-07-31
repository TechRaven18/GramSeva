const express = require('express');
const router = express.Router();
const { 
  sendRegistrationOTP,
  verifyRegistrationOTP,
  completeRegistration,
  sendLoginOTP,
  loginWithOTP,
  forgotPassword,
  resetPasswordWithOTP,
  loginUser, 
  getProfile, 
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// 3-Step Registration Routes
router.post('/send-registration-otp', sendRegistrationOTP);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/complete-registration', completeRegistration);

// Dual Login Routes
router.post('/login', loginUser);
router.post('/send-login-otp', sendLoginOTP);
router.post('/login-with-otp', loginWithOTP);

// Forgot & Reset Password Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOTP);

// Profile Routes
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
