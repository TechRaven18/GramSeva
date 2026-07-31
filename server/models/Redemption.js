const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  redemptionId: {
    type: String,
    required: true,
    unique: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopId: {
    type: String,
    required: true,
    default: 'SHOP-RATION-101'
  },
  shopName: {
    type: String,
    required: true,
    default: 'GramSeva Government Fair Price Ration Shop'
  },
  category: {
    type: String,
    default: 'Ration Store / Essential Commodities'
  },
  merchantName: {
    type: String,
    default: 'Authorized Local Merchant'
  },
  merchantCode: {
    type: String,
    default: 'MCH-1001'
  },
  coins: {
    type: Number,
    required: true
  },
  discountValueRupees: {
    type: Number,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  otpExpiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['OTP_PENDING', 'ACTIVE_VOUCHER', 'VERIFIED', 'EXPIRED', 'CANCELLED'],
    default: 'OTP_PENDING'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Redemption', redemptionSchema);
