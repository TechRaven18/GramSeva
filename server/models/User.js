const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['CITIZEN', 'STAFF', 'ADMIN'],
    default: 'CITIZEN'
  },
  address: {
    district: String,
    block: String,
    panchayat: String,
    village: String,
    landmark: String,
    pincode: String
  },
  rewardCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  jurisdiction: {
    district: String,
    block: String,
    panchayat: String,
    jurisdictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Jurisdiction'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpiry: {
    type: Date,
    default: null
  },
  resetOtpVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
