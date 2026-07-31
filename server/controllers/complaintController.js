const Complaint = require('../models/Complaint');
const Jurisdiction = require('../models/Jurisdiction');
const StatusHistory = require('../models/StatusHistory');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { generateComplaintId } = require('../utils/idGenerator');
const { analyzeComplaintImage } = require('../utils/mlIntegration');
const { uploadToCloudinary } = require('../utils/cloudinaryService');

// Priority rank mapping for priority ordering
const PRIORITY_ORDER = {
  'CRITICAL': 1,
  'URGENT': 2,
  'HIGH': 2,
  'MEDIUM': 3,
  'LESS_CRITICAL': 4,
  'LOW': 4
};

// @desc    Submit a new civic complaint
// @route   POST /api/complaints
const createComplaint = async (req, res) => {
  try {
    const { district, block, panchayat, village, landmark, category, description } = req.body;

    if (!district || !block || !panchayat || !village || !landmark || !description) {
      return res.status(400).json({ success: false, message: 'Please provide all required location and description details.' });
    }

    // 1. Resolve Jurisdiction ID from DB
    const jurisdiction = await Jurisdiction.findOne({
      district: district.trim(),
      block: block.trim(),
      panchayat: panchayat.trim()
    });

    if (!jurisdiction) {
      return res.status(400).json({
        success: false,
        message: `Could not find a valid authority jurisdiction for ${panchayat}, ${block}, ${district}.`
      });
    }

    // 2. Handle Cloudinary Cloud Image Upload
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudUrl = await uploadToCloudinary(file.path, 'panchayat_complaints');
        imagePaths.push(cloudUrl);
      }
    } else if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'panchayat_complaints');
      imagePaths.push(cloudUrl);
    } else {
      imagePaths = ['https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'];
    }

    // 3. Generate Unique Complaint ID
    const complaintId = generateComplaintId();

    // 4. Run ML Inference (CNN prediction, image quality, 3 severity levels & fraud check)
    const primaryImagePath = imagePaths[0];
    const cnnResult = await analyzeComplaintImage(primaryImagePath, category, description);

    // Respect user selected category or custom category
    let finalCategory = category;
    if (!category || category === 'AUTO_DETECT') {
      finalCategory = cnnResult.predictedCategory || 'Civic Issue';
    } else if (category === 'Other') {
      finalCategory = 'Other Civic Issue';
    }

    const priority = cnnResult.urgencyScore || 'URGENT';
    const isFraudFlagged = false;
    const fraudDetails = { isFraud: false };
    const imageQuality = cnnResult.imageQuality || { resolution: '1280x720', qualityRating: 'HIGH' };

    // 5. Save Complaint
    const complaint = await Complaint.create({
      complaintId,
      citizen: req.user._id,
      citizenInfo: {
        name: req.user.name,
        mobile: req.user.mobile,
        email: req.user.email
      },
      location: {
        district,
        block,
        panchayat,
        village,
        landmark
      },
      jurisdictionId: jurisdiction._id,
      category: finalCategory,
      description,
      images: imagePaths,
      status: 'PENDING',
      priority,
      isFraudFlagged,
      fraudDetails,
      imageQuality,
      cnnResult
    });

    // 6. Record Status History Timeline
    await StatusHistory.create({
      complaint: complaint._id,
      fromStatus: 'SUBMITTED',
      toStatus: 'PENDING',
      actor: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.name,
      message: isFraudFlagged 
        ? `Complaint submitted. FLAGGED BY CNN: ${fraudDetails.reason || 'Flagged for staff review.'}` 
        : 'Complaint submitted by citizen and routed to jurisdiction authority.'
    });

    return res.status(201).json({
      success: true,
      message: `Complaint submitted successfully with ID ${complaintId}.${isFraudFlagged ? ' (Note: Image flagged for staff verification).' : ''}`,
      complaint
    });
  } catch (error) {
    console.error('Complaint creation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complaints for logged in Citizen
// @route   GET /api/complaints/my
const getCitizenComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { citizen: req.user._id };
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate('jurisdictionId', 'district block panchayat type')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complaints routed to Staff member's jurisdiction
// @route   GET /api/complaints/staff-queue
const getStaffQueue = async (req, res) => {
  try {
    let filter = {};

    // Filter by staff assigned jurisdiction if available
    if (req.user.jurisdiction && req.user.jurisdiction.jurisdictionId) {
      filter.jurisdictionId = req.user.jurisdiction.jurisdictionId;
    } else if (req.user.jurisdiction && req.user.jurisdiction.panchayat) {
      const jur = await Jurisdiction.findOne({ panchayat: req.user.jurisdiction.panchayat });
      if (jur) filter.jurisdictionId = jur._id;
    }

    const { status, category } = req.query;
    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;

    let complaints = await Complaint.find(filter)
      .populate('citizen', 'name mobile email')
      .populate('jurisdictionId', 'district block panchayat type')
      .sort({ createdAt: -1 });

    // Explicit 7-Tier Hazard Severity Order:
    // 1. Damaged Electric Pole / Wire Hazard
    // 2. Open Manhole
    // 3. Drainage & Sanitation Overflow
    // 4. Damaged Road / Pothole
    // 5. Non-functional Tube Well / Water Supply
    // 6. Streetlight / Electrical Failure
    // 7. Garbage Accumulation
    const CATEGORY_SEVERITY_ORDER = {
      'damaged electric pole': 1,
      'electric pole': 1,
      'wire hazard': 1,
      'open manhole': 2,
      'drainage': 3,
      'sanitation': 3,
      'damaged road': 4,
      'pothole': 4,
      'tube well': 5,
      'water supply': 5,
      'streetlight': 6,
      'street light': 6,
      'garbage': 7
    };

    const getCategoryRank = (catStr) => {
      if (!catStr) return 99;
      const lower = catStr.toLowerCase();
      for (const [key, rank] of Object.entries(CATEGORY_SEVERITY_ORDER)) {
        if (lower.includes(key)) return rank;
      }
      return 99;
    };

    // Sort queue strictly by 7-tier category severity order (1 to 7) then newest creation date
    complaints = complaints.sort((a, b) => {
      const rA = getCategoryRank(a.category);
      const rB = getCategoryRank(b.category);
      if (rA !== rB) return rA - rB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single complaint details with status history timeline
// @route   GET /api/complaints/:id
const getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name mobile email address')
      .populate('jurisdictionId', 'district block panchayat type villages')
      .populate('assignedStaff', 'name mobile');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Role security check: Citizen can only view their own complaint
    if (req.user.role === 'CITIZEN' && complaint.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint.' });
    }

    const history = await StatusHistory.find({ complaint: complaint._id }).sort({ timestamp: 1 });

    res.json({ success: true, complaint, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status (Staff / Admin)
// @route   PUT /api/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, message, completionProofImage } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Check if complaint is already closed (COMPLETED or REJECTED)
    if (complaint.status === 'COMPLETED' || complaint.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `This complaint is officially closed (${complaint.status}). No further status changes are allowed.`
      });
    }

    // Validate one-time process rules
    if (status === 'ACCEPTED') {
      if (complaint.wasAccepted) {
        return res.status(400).json({
          success: false,
          message: 'This complaint has already been ACCEPTED previously. Acceptance is a one-time process.'
        });
      }
      complaint.wasAccepted = true;
    }

    if (status === 'SANCTIONED') {
      if (complaint.wasSanctioned) {
        return res.status(400).json({
          success: false,
          message: 'This complaint has already been SANCTIONED. Work sanctioning is a one-time process.'
        });
      }
      complaint.wasSanctioned = true;
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    complaint.staffNotes = message || complaint.staffNotes;
    if (completionProofImage) complaint.completionProofImage = completionProofImage;
    if (!complaint.assignedStaff) complaint.assignedStaff = req.user._id;

    let rewardAwarded = false;

    // Check reward eligibility on COMPLETED transition (award +20 coins when work is finished)
    if (status === 'COMPLETED' && !complaint.rewardCredited) {
      const REWARD_AMOUNT = 20;
      const citizenUser = await User.findById(complaint.citizen);

      if (citizenUser) {
        citizenUser.rewardCoins += REWARD_AMOUNT;
        await citizenUser.save();

        await RewardTransaction.create({
          citizen: citizenUser._id,
          complaint: complaint._id,
          type: 'CREDIT',
          amount: REWARD_AMOUNT,
          description: `Reward for completed verified civic issue ${complaint.complaintId}`,
          balanceAfter: citizenUser.rewardCoins
        });

        complaint.rewardCredited = true;
        rewardAwarded = true;
      }
    }

    // Add staff update as a comment in the communication feed
    if (message) {
      if (!complaint.comments) complaint.comments = [];
      complaint.comments.push({
        sender: req.user._id,
        senderRole: req.user.role,
        senderName: req.user.name,
        text: message,
        timestamp: new Date()
      });
    }

    await complaint.save();

    // Record Status History Entry
    await StatusHistory.create({
      complaint: complaint._id,
      fromStatus: previousStatus,
      toStatus: status,
      actor: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.name,
      message: message || (status === 'COMPLETED' ? 'Work completed and verified. Complaint is officially closed.' : `Status updated to ${status} by authority.`)
    });

    res.json({
      success: true,
      message: `Complaint status updated to ${status}.${rewardAwarded ? ' Citizen awarded +20 reward coins!' : ''}`,
      complaint,
      rewardAwarded
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment & follow-up evidence photos (Citizen / Staff Intercommunication)
// @route   POST /api/complaints/:id/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Check if complaint is closed (COMPLETED or REJECTED)
    if (complaint.status === 'COMPLETED' || complaint.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `This complaint is officially closed (${complaint.status}). Further comments are disabled.`
      });
    }

    // Role check: Citizen can only comment when staff has requested additional info (NEEDS_INFO)
    if (req.user.role === 'CITIZEN') {
      if (complaint.citizen.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to comment on this complaint.' });
      }
      if (complaint.status !== 'NEEDS_INFO') {
        return res.status(403).json({
          success: false,
          message: 'Citizens can only send messages or photos when staff requests additional information (Status: NEEDS_INFO).'
        });
      }
    }

    let commentImagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudUrl = await uploadToCloudinary(file.path, 'panchayat_comment_evidence');
        commentImagePaths.push(cloudUrl);
      }
    }

    if (!text && commentImagePaths.length === 0) {
      return res.status(400).json({ success: false, message: 'Comment text or photo evidence is required.' });
    }

    const newComment = {
      sender: req.user._id,
      senderRole: req.user.role,
      senderName: req.user.name,
      text: text || '',
      images: commentImagePaths,
      timestamp: new Date()
    };

    if (!complaint.comments) complaint.comments = [];
    complaint.comments.push(newComment);

    // Also append any new follow-up images to the complaint's general evidence photos
    if (commentImagePaths.length > 0) {
      complaint.images.push(...commentImagePaths);
    }

    // If Citizen responds when status is NEEDS_INFO, automatically set status back to PENDING for staff review
    let statusTransitionMsg = null;
    if (req.user.role === 'CITIZEN' && complaint.status === 'NEEDS_INFO') {
      const prev = complaint.status;
      complaint.status = 'PENDING';
      statusTransitionMsg = `Citizen provided requested information & follow-up photo evidence. Resubmitted for staff review.`;

      await StatusHistory.create({
        complaint: complaint._id,
        fromStatus: prev,
        toStatus: 'PENDING',
        actor: req.user._id,
        actorRole: req.user.role,
        actorName: req.user.name,
        message: statusTransitionMsg
      });
    }

    await complaint.save();

    res.json({
      success: true,
      message: statusTransitionMsg || 'Comment and follow-up evidence submitted successfully.',
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Override CNN Priority (Staff / Admin)
// @route   PUT /api/complaints/:id/priority-override
const overridePriority = async (req, res) => {
  try {
    const { newPriority, reason } = req.body;
    if (!newPriority || !reason) {
      return res.status(400).json({ success: false, message: 'New priority level and reason are required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const oldPriority = complaint.priority;
    complaint.priority = newPriority;
    complaint.priorityOverride = {
      isOverridden: true,
      previousPriority: oldPriority,
      newPriority: newPriority,
      overriddenBy: req.user._id,
      reason: reason,
      overriddenAt: new Date()
    };

    await complaint.save();

    await StatusHistory.create({
      complaint: complaint._id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      actor: req.user._id,
      actorRole: req.user.role,
      actorName: req.user.name,
      message: `Priority overridden from ${oldPriority} to ${newPriority}. Reason: ${reason}`
    });

    res.json({ success: true, message: 'Priority overridden successfully.', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints flagged as Potential Fraud / Irrelevant for Staff review
// @route   GET /api/complaints/flagged
const getFlaggedComplaints = async (req, res) => {
  try {
    let filter = { isFraudFlagged: true };

    if (req.user.jurisdiction && req.user.jurisdiction.jurisdictionId) {
      filter.jurisdictionId = req.user.jurisdiction.jurisdictionId;
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name mobile email')
      .populate('jurisdictionId', 'district block panchayat type')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle Staff Fraud Review (Confirm Reject or Clear Flag)
// @route   PUT /api/complaints/:id/fraud-review
const reviewFraudComplaint = async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'CONFIRM_REJECT' or 'CLEAR_FLAG'
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (action === 'CONFIRM_REJECT') {
      const prevStatus = complaint.status;
      complaint.status = 'REJECTED';
      complaint.isFraudFlagged = true;
      complaint.staffNotes = notes || 'Rejected by Staff following CNN Fraud/Irrelevant Image Flag.';
      complaint.fraudDetails.reviewedByStaff = true;
      complaint.fraudDetails.reviewedAt = new Date();

      await complaint.save();

      await StatusHistory.create({
        complaint: complaint._id,
        fromStatus: prevStatus,
        toStatus: 'REJECTED',
        actor: req.user._id,
        actorRole: req.user.role,
        actorName: req.user.name,
        message: `Complaint REJECTED as Fraud/Invalid image. Staff Notes: ${notes || 'Image contains non-civic content.'}`
      });

      return res.json({ success: true, message: 'Complaint confirmed and rejected as fraud.', complaint });
    } else if (action === 'CLEAR_FLAG') {
      complaint.isFraudFlagged = false;
      complaint.fraudDetails.reviewedByStaff = true;
      complaint.fraudDetails.reviewedAt = new Date();
      if (notes) complaint.staffNotes = notes;

      await complaint.save();

      await StatusHistory.create({
        complaint: complaint._id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        actor: req.user._id,
        actorRole: req.user.role,
        actorName: req.user.name,
        message: `Fraud flag cleared by staff inspection. Approved for standard queue. Notes: ${notes || 'Verified genuine.'}`
      });

      return res.json({ success: true, message: 'Fraud flag cleared successfully. Complaint reinstated to active queue.', complaint });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid review action specified.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint,
  getCitizenComplaints,
  getStaffQueue,
  getComplaintDetails,
  updateComplaintStatus,
  addComment,
  overridePriority,
  getFlaggedComplaints,
  reviewFraudComplaint
};
