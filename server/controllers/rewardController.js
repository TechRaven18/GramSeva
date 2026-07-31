const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const Redemption = require('../models/Redemption');
const { generateRedemptionId, generateOTP } = require('../utils/idGenerator');
const { sendRealEmail } = require('../utils/notificationService');
const { PARTNER_SHOPS } = require('../utils/shopData');

// @desc    Get public partner shops list
// @route   GET /api/rewards/partner-shops
const getPartnerShops = async (req, res) => {
  res.json({
    success: true,
    shops: PARTNER_SHOPS
  });
};

// @desc    Get logged in citizen's reward balance & ledger history
// @route   GET /api/rewards/my
const getMyRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rewardCoins name mobile email');
    const transactions = await RewardTransaction.find({ citizen: req.user._id })
      .populate('complaint', 'complaintId category status')
      .sort({ timestamp: -1 });

    const redemptions = await Redemption.find({ citizen: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rewardCoins: user.rewardCoins,
      transactions,
      redemptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Citizen requests reward redemption (multiples of 100 coins)
// @route   POST /api/rewards/request-redemption
const requestRedemption = async (req, res) => {
  try {
    const { coins, coinsToRedeem, shopId, merchantName } = req.body;
    const amount = Number(coins !== undefined ? coins : coinsToRedeem);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid coin amount to redeem.' });
    }

    if (amount % 100 !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Redemption coins must be in multiples of 100 (e.g. 100, 200, 300, 400 Coins).'
      });
    }

    const user = await User.findById(req.user._id);

    if (user.rewardCoins < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient reward coins balance. You have ${user.rewardCoins} coins, but requested ${amount} coins.`
      });
    }

    // Resolve target shop from partner database
    const targetShopId = shopId ? shopId.trim().toUpperCase() : 'SHOP-RATION-101';
    const shopDetail = PARTNER_SHOPS.find(s => s.shopId === targetShopId) || PARTNER_SHOPS[0];

    const redemptionId = generateRedemptionId();
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    // 1. Deduct coins immediately from citizen balance
    user.rewardCoins -= amount;
    await user.save();

    // 2. Create Redemption active voucher record
    const redemption = await Redemption.create({
      redemptionId,
      citizen: user._id,
      shopId: shopDetail.shopId,
      shopName: shopDetail.name,
      category: shopDetail.category,
      merchantName: merchantName || shopDetail.name,
      merchantCode: shopDetail.shopId,
      coins: amount,
      discountValueRupees: amount,
      otp,
      otpExpiresAt,
      status: 'ACTIVE_VOUCHER'
    });

    // 3. Create Reward Transaction Debit Entry
    await RewardTransaction.create({
      citizen: user._id,
      type: 'DEBIT',
      amount: amount,
      description: `Redeemed ${amount} coins for ₹${amount} discount at ${shopDetail.name} (${shopDetail.shopId})`,
      balanceAfter: user.rewardCoins
    });

    // 4. Send Real Email Notification to Citizen
    if (user.email) {
      await sendRealEmail({
        to: user.email,
        subject: `GramSeva Reward Voucher (₹${amount} Store Discount at ${shopDetail.name})`,
        text: `Dear ${user.name}, your ₹${amount} discount voucher for ${shopDetail.name} (Shop ID: ${shopDetail.shopId}) is generated. Present OTP ${otp} at the counter (Redemption ID: ${redemptionId}). Remaining Coins: ${user.rewardCoins}.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 10px;">
            <h2 style="color: #fbbf24;">GramSeva Merchant Voucher Generated</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>You redeemed <strong>${amount} Coins (₹${amount} Discount)</strong> for <strong>${shopDetail.name}</strong> (Shop ID: <code>${shopDetail.shopId}</code>).</p>
            <p>Your 6-digit Store Redemption OTP Code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #60a5fa; letter-spacing: 6px; margin: 15px 0;">${otp}</div>
            <p>Your new remaining reward balance: <strong>${user.rewardCoins} Coins</strong></p>
            <p style="color: #94a3b8; font-size: 13px;">Redemption ID: <strong>${redemptionId}</strong> | Present at counter for ₹${amount} billing discount.</p>
          </div>
        `
      });
    }

    // Real-time Socket.IO Broadcast
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.to(`citizen_${user._id}`).emit('reward:updated', {
        rewardCoins: user.rewardCoins,
        redemption
      });
    } catch (e) {
      console.warn('[Socket.IO Emit Warning]:', e.message);
    }

    res.status(201).json({
      success: true,
      message: `Successfully redeemed ${amount} coins for ₹${amount} discount at ${shopDetail.name}!`,
      newBalance: user.rewardCoins,
      redemption
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Merchant verifies OTP and completes redemption (Merchant / Staff API)
// @route   POST /api/rewards/verify-redemption
const verifyRedemption = async (req, res) => {
  try {
    const { redemptionId, otp } = req.body;

    if (!redemptionId || !otp) {
      return res.status(400).json({ success: false, message: 'Redemption ID and OTP are required.' });
    }

    const redemption = await Redemption.findOne({ redemptionId });
    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption record not found.' });
    }

    if (redemption.status === 'VERIFIED') {
      return res.status(400).json({ success: false, message: 'Redemption voucher has already been verified and used.' });
    }

    if (redemption.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP entered.' });
    }

    redemption.status = 'VERIFIED';
    redemption.verifiedAt = new Date();
    await redemption.save();

    res.json({
      success: true,
      message: `Voucher ${redemption.redemptionId} (₹${redemption.discountValueRupees} discount) verified successfully!`,
      redemption
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPartnerShops,
  getMyRewards,
  requestRedemption,
  verifyRedemption
};
