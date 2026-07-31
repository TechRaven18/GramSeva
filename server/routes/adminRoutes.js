const express = require('express');
const router = express.Router();
const {
  createStaff,
  getStaffList,
  toggleStaffStatus,
  deleteStaff,
  resetStaffPassword,
  getPanchayatAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/staff', createStaff);
router.get('/staff', getStaffList);
router.put('/staff/:id/toggle-status', toggleStaffStatus);
router.delete('/staff/:id', deleteStaff);
router.put('/staff/:id/reset-password', resetStaffPassword);
router.get('/analytics', getPanchayatAnalytics);

module.exports = router;
