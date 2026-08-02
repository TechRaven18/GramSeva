const express = require('express');
const router = express.Router();
const {
  createStaff,
  getStaffList,
  toggleStaffStatus,
  deleteStaff,
  resetStaffPassword,
  getPanchayatAnalytics,
  searchComplaintByNumber,
  adminUpdateComplaintStatus,
  adminDeleteComplaint,
  getDirectApplications,
  markApplicationViewed
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

// Complaint Authority Lookup & Override Routes
router.get('/complaint-lookup/:complaintNumber', searchComplaintByNumber);
router.put('/complaint/:id/status-override', adminUpdateComplaintStatus);
router.delete('/complaint/:id', adminDeleteComplaint);

// Citizen Direct Application Routes
router.get('/applications', getDirectApplications);
router.put('/applications/:id/view', markApplicationViewed);

module.exports = router;
