const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getCitizenComplaints,
  getStaffQueue,
  getComplaintDetails,
  updateComplaintStatus,
  addComment,
  overridePriority,
  getFlaggedComplaints,
  reviewFraudComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.array('images', 3), createComplaint);
router.get('/my', protect, getCitizenComplaints);
router.get('/staff-queue', protect, authorize('STAFF', 'ADMIN'), getStaffQueue);
router.get('/flagged', protect, authorize('STAFF', 'ADMIN'), getFlaggedComplaints);
router.get('/:id', protect, getComplaintDetails);
router.put('/:id/status', protect, authorize('STAFF', 'ADMIN'), updateComplaintStatus);
router.post('/:id/comments', protect, upload.array('images', 3), addComment);
router.put('/:id/priority-override', protect, authorize('STAFF', 'ADMIN'), overridePriority);
router.put('/:id/fraud-review', protect, authorize('STAFF', 'ADMIN'), reviewFraudComplaint);

module.exports = router;
