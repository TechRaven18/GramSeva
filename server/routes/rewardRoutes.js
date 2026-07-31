const express = require('express');
const router = express.Router();
const { getPartnerShops, getMyRewards, requestRedemption, verifyRedemption } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/partner-shops', getPartnerShops);
router.get('/my', protect, getMyRewards);
router.post('/request-redemption', protect, requestRedemption);
router.post('/verify-redemption', protect, verifyRedemption);

module.exports = router;
