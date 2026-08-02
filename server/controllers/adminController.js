const User = require('../models/User');
const Jurisdiction = require('../models/Jurisdiction');
const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const CitizenApplication = require('../models/CitizenApplication');
const bcrypt = require('bcryptjs');

// @desc    Create new Staff account assigned to a jurisdiction
// @route   POST /api/admin/staff
const createStaff = async (req, res) => {
  try {
    const { name, mobile, email, password, jurisdictionId } = req.body;

    if (!name || !email || !password || !jurisdictionId) {
      return res.status(400).json({ success: false, message: 'Name, Email address, initial password, and jurisdiction selection are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user account with this email address already exists.' });
    }

    if (mobile) {
      const existingMobile = await User.findOne({ mobile: mobile.trim() });
      if (existingMobile) {
        return res.status(400).json({ success: false, message: 'A user account with this mobile number already exists.' });
      }
    }

    const jurisdiction = await Jurisdiction.findById(jurisdictionId);
    if (!jurisdiction) {
      return res.status(404).json({ success: false, message: 'Selected jurisdiction does not exist.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staff = await User.create({
      name: name.trim(),
      mobile: mobile ? mobile.trim() : '',
      email: cleanEmail,
      password: hashedPassword,
      role: 'STAFF',
      jurisdiction: {
        district: jurisdiction.district,
        block: jurisdiction.block,
        panchayat: jurisdiction.panchayat,
        jurisdictionId: jurisdiction._id
      }
    });

    res.status(201).json({
      success: true,
      message: `Staff account created for ${name} under ${jurisdiction.panchayat} (${jurisdiction.block}).`,
      staff: {
        _id: staff._id,
        name: staff.name,
        mobile: staff.mobile,
        email: staff.email,
        role: staff.role,
        jurisdiction: staff.jurisdiction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff members with jurisdiction details
// @route   GET /api/admin/staff
const getStaffList = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'STAFF' })
      .populate('jurisdiction.jurisdictionId', 'district block panchayat type')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: staffMembers.length, staff: staffMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle staff active status (activate/deactivate)
// @route   PUT /api/admin/staff/:id/toggle-status
const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    const updatedStaff = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: !staff.isActive } },
      { new: true }
    );

    res.json({
      success: true,
      message: `Staff account ${updatedStaff.name} is now ${updatedStaff.isActive ? 'ACTIVE' : 'DEACTIVATED'}.`,
      isActive: updatedStaff.isActive
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset staff password (Admin only)
// @route   PUT /api/admin/staff/:id/reset-password
const resetStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    staff.password = await bcrypt.hash(newPassword, salt);
    await staff.save();

    res.json({ success: true, message: `Password for staff ${staff.name} has been successfully reset.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Panchayat / Municipality analytics & resolution ranking metrics
// @route   GET /api/admin/analytics
const getPanchayatAnalytics = async (req, res) => {
  try {
    const jurisdictions = await Jurisdiction.find({}).sort({ district: 1, block: 1, panchayat: 1 });

    const analytics = await Promise.all(jurisdictions.map(async (jur) => {
      const complaints = await Complaint.find({ jurisdictionId: jur._id });

      const total = complaints.length;
      const pending = complaints.filter(c => c.status === 'PENDING').length;
      const needsInfo = complaints.filter(c => c.status === 'NEEDS_INFO').length;
      const accepted = complaints.filter(c => c.status === 'ACCEPTED').length;
      const sanctioned = complaints.filter(c => c.status === 'SANCTIONED').length;
      const completed = complaints.filter(c => c.status === 'COMPLETED').length;
      const rejected = complaints.filter(c => c.status === 'REJECTED').length;

      const completionRate = total > 0 ? Math.round(((completed + sanctioned) / total) * 100) : 0;

      const staffCount = await User.countDocuments({
        role: 'STAFF',
        'jurisdiction.jurisdictionId': jur._id
      });

      return {
        _id: jur._id,
        district: jur.district,
        block: jur.block,
        panchayat: jur.panchayat,
        type: jur.type,
        staffCount,
        metrics: {
          total,
          pending,
          needsInfo,
          accepted,
          sanctioned,
          completed,
          rejected,
          completionRate
        }
      };
    }));

    analytics.sort((a, b) => {
      if (b.metrics.completed !== a.metrics.completed) {
        return b.metrics.completed - a.metrics.completed;
      }
      return b.metrics.total - a.metrics.total;
    });

    const totalComplaints = await Complaint.countDocuments({});
    const totalCitizens = await User.countDocuments({ role: 'CITIZEN' });
    const totalStaff = await User.countDocuments({ role: 'STAFF' });
    const completedComplaints = await Complaint.countDocuments({ status: 'COMPLETED' });

    res.json({
      success: true,
      overview: {
        totalComplaints,
        totalCitizens,
        totalStaff,
        completedComplaints,
        resolutionRate: totalComplaints > 0 ? Math.round((completedComplaints / totalComplaints) * 100) : 0
      },
      jurisdictions: analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete staff account permanently (Admin only)
// @route   DELETE /api/admin/staff/:id
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Staff account for ${staff.name} (${staff.email}) has been permanently deleted from the database.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// NEW ADMIN AUTHORITY FEATURES
// ==========================================

// @desc    Search complaint by Complaint Number (Admin authority lookup)
// @route   GET /api/admin/complaint-lookup/:complaintNumber
const searchComplaintByNumber = async (req, res) => {
  try {
    const { complaintNumber } = req.params;
    if (!complaintNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Complaint Number.' });
    }

    const cleanId = complaintNumber.trim();
    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: cleanId },
        { complaintId: { $regex: cleanId, $options: 'i' } }
      ]
    })
      .populate('citizen', 'name email mobile address')
      .populate('jurisdictionId', 'district block panchayat type')
      .populate('assignedStaff', 'name email mobile');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No complaint found matching Complaint Number "${cleanId}".`
      });
    }

    const history = await StatusHistory.find({ complaint: complaint._id }).sort({ timestamp: 1 });

    res.json({
      success: true,
      complaint,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Status Override (Allows changing REJECTED -> PENDING, etc.)
// @route   PUT /api/admin/complaint/:id/status-override
const adminUpdateComplaintStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'NEEDS_INFO', 'SANCTIONED', 'COMPLETED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}` });
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    if (message) complaint.staffNotes = message;

    // Reset status flags if reverted back to PENDING
    if (status === 'PENDING') {
      complaint.isFraudFlagged = false;
    }

    await complaint.save();

    // Create Audit Record
    await StatusHistory.create({
      complaint: complaint._id,
      fromStatus: previousStatus,
      toStatus: status,
      actor: req.user._id,
      actorRole: req.user.role,
      actorName: `${req.user.name} (System Administrator)`,
      message: message || `Admin authority status override: Changed from ${previousStatus} to ${status}.`
    });

    // Real-time Socket.IO Broadcast
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      const citizenId = complaint.citizen?._id || complaint.citizen;
      io.to(`citizen_${citizenId}`).emit('complaint:updated', complaint);
      io.to(`jurisdiction_${complaint.jurisdictionId}`).emit('complaint:updated', complaint);
      io.to(`complaint_${complaint._id}`).emit('complaint:updated', complaint);
      io.to('admin_global').emit('complaint:updated', complaint);
    } catch (e) {
      console.warn('[Socket.IO Emit Warning]:', e.message);
    }

    res.json({
      success: true,
      message: `Complaint ${complaint.complaintId} status override successful: Changed from ${previousStatus} to ${status}.`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Delete Complaint Permanently
// @route   DELETE /api/admin/complaint/:id
const adminDeleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const deletedId = complaint.complaintId;
    const citizenId = complaint.citizen;

    await Complaint.findByIdAndDelete(req.params.id);
    await StatusHistory.deleteMany({ complaint: req.params.id });

    // Socket.IO Emit
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.to(`citizen_${citizenId}`).emit('complaint:updated', { _id: req.params.id, status: 'DELETED' });
      io.to('admin_global').emit('complaint:updated', { _id: req.params.id, status: 'DELETED' });
    } catch (e) {}

    res.json({
      success: true,
      message: `Complaint ${deletedId} has been permanently deleted from the system.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all direct citizen applications to Admin
// @route   GET /api/admin/applications
const getDirectApplications = async (req, res) => {
  try {
    const applications = await CitizenApplication.find({})
      .populate('citizen', 'name email mobile address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin marks a citizen application as VIEWED
// @route   PUT /api/admin/applications/:id/view
const markApplicationViewed = async (req, res) => {
  try {
    const application = await CitizenApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    application.status = 'VIEWED';
    application.viewedAt = new Date();
    application.viewedBy = req.user._id;

    await application.save();

    // Socket.IO Broadcast to Citizen
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.to(`citizen_${application.citizen}`).emit('application:viewed', application);
    } catch (e) {}

    res.json({
      success: true,
      message: `Application for Complaint #${application.complaintNumber} marked as VIEWED.`,
      application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
