const User = require('../models/User');
const Jurisdiction = require('../models/Jurisdiction');
const Complaint = require('../models/Complaint');
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

    // Sort panchayats strictly by total completed complaints descending
    analytics.sort((a, b) => {
      if (b.metrics.completed !== a.metrics.completed) {
        return b.metrics.completed - a.metrics.completed;
      }
      return b.metrics.total - a.metrics.total;
    });

    // Calculate system overview counts
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

module.exports = {
  createStaff,
  getStaffList,
  toggleStaffStatus,
  deleteStaff,
  resetStaffPassword,
  getPanchayatAnalytics
};
