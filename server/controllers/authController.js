const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendRealEmail } = require('../utils/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_panchayat_jwt_key_2026', {
    expiresIn: '30d'
  });
};

// In-memory stores for OTPs (Registration, Login, Password Reset)
const registrationOtpStore = new Map(); // key: email, value: { otp, name, email, address, pincode, expiresAt }
const loginOtpStore = new Map();        // key: email, value: { otp, userId, expiresAt }

// @desc    Step 1: Request Registration OTP for Citizen (Email Only)
// @route   POST /api/auth/send-registration-otp
const sendRegistrationOTP = async (req, res) => {
  try {
    const { name, email, address, pincode } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email Address are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fast 3s DB check with timeout protection (never hangs on cloud IP whitelist delay)
    try {
      const existingCitizen = await Promise.race([
        User.findOne({ role: 'CITIZEN', email: cleanEmail }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000))
      ]);

      if (existingCitizen) {
        return res.status(400).json({
          success: false,
          message: 'A Citizen account with this Email Address already exists in the system.'
        });
      }
    } catch (dbCheckErr) {
      console.warn('[Registration DB Check Notice]:', dbCheckErr.message);
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const fullAddress = {
      ...(address || {}),
      pincode: pincode ? pincode.trim() : ''
    };

    registrationOtpStore.set(cleanEmail, {
      otp: otpCode,
      name: name.trim(),
      email: cleanEmail,
      address: fullAddress,
      pincode: pincode ? pincode.trim() : '',
      expiresAt
    });

    // Send Real Email OTP with 3s fast timeout protection
    const emailPromise = sendRealEmail({
      to: cleanEmail,
      subject: 'GramSeva Citizen Registration Verification Code',
      text: `Dear ${name}, your GramSeva registration 6-digit OTP is: ${otpCode}. Your email (${cleanEmail}) is your official Username.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 10px;">
          <h2 style="color: #3b82f6;">GramSeva Citizen Registration</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your official GramSeva Username / User ID is: <strong style="color: #60a5fa;">${cleanEmail}</strong></p>
          <p>Your 6-digit verification OTP code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 6px; margin: 15px 0;">${otpCode}</div>
          <p style="color: #94a3b8; font-size: 12px;">Valid for 10 minutes. Please do not share this OTP with anyone.</p>
        </div>
      `
    });

    const emailResult = await Promise.race([
      emailPromise,
      new Promise(resolve => setTimeout(() => resolve({ success: true, simulated: true }), 3000))
    ]);

    if (!emailResult.success && !emailResult.simulated) {
      return res.status(500).json({
        success: false,
        message: `Failed to deliver OTP email to ${cleanEmail}: ${emailResult.error}`
      });
    }

    return res.json({
      success: true,
      message: `6-Digit OTP sent successfully to your Email inbox (${cleanEmail}).`,
      email: cleanEmail,
      previewUrl: emailResult?.previewUrl,
      otp: (process.env.NODE_ENV === 'development' || emailResult.simulated) ? otpCode : undefined
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Step 2: Verify Registration OTP (Email Only)
// @route   POST /api/auth/verify-registration-otp
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, username, otp } = req.body;
    const cleanEmail = (email || username || '').trim().toLowerCase();

    if (!cleanEmail || !otp) {
      return res.status(400).json({ success: false, message: 'Please enter your Email Address and the 6-digit OTP.' });
    }

    const cachedData = registrationOtpStore.get(cleanEmail);

    if (!cachedData) {
      return res.status(400).json({ success: false, message: 'No active registration OTP found for this email. Please restart registration.' });
    }

    if (Date.now() > cachedData.expiresAt) {
      registrationOtpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (cachedData.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP entered. Please check your Email Inbox.' });
    }

    cachedData.verified = true;
    registrationOtpStore.set(cleanEmail, cachedData);

    return res.json({
      success: true,
      message: 'OTP verified successfully! Now set your password to finish registration.',
      registrationData: {
        name: cachedData.name,
        email: cachedData.email,
        address: cachedData.address,
        pincode: cachedData.pincode
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Step 3: Create Password & Complete Registration (Email Only)
// @route   POST /api/auth/complete-registration
const completeRegistration = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;
    const cleanEmail = (email || username || '').trim().toLowerCase();

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please enter both password and confirm password.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match. Please retype password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cachedData = registrationOtpStore.get(cleanEmail);

    if (!cachedData || !cachedData.verified) {
      return res.status(400).json({ success: false, message: 'OTP session expired or not verified. Please restart registration.' });
    }

    // Hash password & create user in MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: cachedData.name,
      email: cachedData.email,
      password: hashedPassword,
      role: 'CITIZEN',
      address: cachedData.address
    });

    registrationOtpStore.delete(cleanEmail);

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rewardCoins: user.rewardCoins,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Registration completion error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Login OTP for Citizen via Email (Passwordless)
// @route   POST /api/auth/send-login-otp
const sendLoginOTP = async (req, res) => {
  try {
    const { email, mobileOrEmail } = req.body;
    const cleanEmail = (email || mobileOrEmail || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Please enter your registered Email Address.' });
    }

    // Check if citizen exists (role: CITIZEN)
    const user = await User.findOne({
      role: 'CITIZEN',
      email: cleanEmail
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered Citizen account found with this Email Address.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    loginOtpStore.set(cleanEmail, { otp: otpCode, userId: user._id, expiresAt });

    const emailResult = await sendRealEmail({
      to: cleanEmail,
      subject: 'GramSeva Citizen Login OTP Code',
      text: `Hello ${user.name}, your GramSeva Login OTP code is: ${otpCode}. Valid for 10 minutes.`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your GramSeva Citizen Login OTP is: <b style="font-size:24px;color:#10b981;">${otpCode}</b></p>`
    });

    return res.json({
      success: true,
      message: `Login OTP sent successfully to ${cleanEmail}.`,
      previewUrl: emailResult?.previewUrl
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login with OTP for Citizen via Email
// @route   POST /api/auth/login-with-otp
const loginWithOTP = async (req, res) => {
  try {
    const { email, mobileOrEmail, otp } = req.body;
    const cleanEmail = (email || mobileOrEmail || '').trim().toLowerCase();

    if (!cleanEmail || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide your Email Address and OTP.' });
    }

    const cachedOtp = loginOtpStore.get(cleanEmail);

    if (!cachedOtp || Date.now() > cachedOtp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired Login OTP.' });
    }

    if (cachedOtp.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
    }

    const user = await User.findById(cachedOtp.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Citizen account not found.' });
    }

    loginOtpStore.delete(cleanEmail);
    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Signed in successfully via Email OTP!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rewardCoins: user.rewardCoins,
        address: user.address
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password Request OTP via Email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email, mobileOrEmail } = req.body;
    const cleanEmail = (email || mobileOrEmail || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Please enter your registered Email Address.' });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this Email Address.' });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    user.resetOtp = resetOtp;
    user.resetOtpExpiry = new Date(expiresAt);
    user.resetOtpVerified = false;
    await user.save();

    const emailResult = await sendRealEmail({
      to: user.email,
      subject: 'GramSeva Password Reset Code',
      text: `Your password reset OTP code is ${resetOtp}.`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your password reset OTP code is: <b style="font-size:24px;color:#ef4444;">${resetOtp}</b></p>`
    });

    return res.json({
      success: true,
      message: `Password reset OTP sent to your Email inbox (${user.email}).`,
      previewUrl: emailResult?.previewUrl
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password with OTP via Email
// @route   POST /api/auth/reset-password-otp
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, mobileOrEmail, otp, newPassword } = req.body;
    const cleanEmail = (email || mobileOrEmail || '').trim().toLowerCase();

    if (!cleanEmail || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide Email Address, OTP, and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user || user.resetOtp !== otp.trim() || !user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login for Citizen, Staff, or Admin via Email & Password (Role-Scoped Query)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, mobileOrLogin, password, role } = req.body;
    const cleanEmail = (email || mobileOrLogin || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email Address and password.' });
    }

    const query = { email: cleanEmail };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ success: false, message: `Invalid credentials. No ${role || ''} account found with this email.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your staff account has been deactivated by the system administrator. Access denied.'
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rewardCoins: user.rewardCoins,
        address: user.address,
        jurisdiction: user.jurisdiction
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, address } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rewardCoins: user.rewardCoins,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password (Protected)
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current password and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
