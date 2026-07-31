const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  citizenInfo: {
    name: String,
    mobile: String,
    email: String
  },
  location: {
    district: { type: String, required: true },
    block: { type: String, required: true },
    panchayat: { type: String, required: true },
    village: { type: String, required: true },
    landmark: { type: String, required: true }
  },
  jurisdictionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jurisdiction',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['PENDING', 'NEEDS_INFO', 'ACCEPTED', 'SANCTIONED', 'COMPLETED', 'REJECTED'],
    default: 'PENDING'
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'URGENT', 'LESS_CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'URGENT'
  },
  isFraudFlagged: {
    type: Boolean,
    default: false
  },
  fraudDetails: {
    isFraud: { type: Boolean, default: false },
    category: String,
    reason: String,
    reviewedByStaff: { type: Boolean, default: false },
    reviewedAt: Date
  },
  imageQuality: {
    resolution: String,
    width: Number,
    height: Number,
    sharpnessScore: Number,
    qualityRating: String
  },
  cnnResult: {
    predictedCategory: String,
    confidence: Number,
    urgencyScore: String,
    analyzedAt: Date,
    modelVersion: String
  },
  priorityOverride: {
    isOverridden: { type: Boolean, default: false },
    previousPriority: String,
    newPriority: String,
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    overriddenAt: Date
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rewardCredited: {
    type: Boolean,
    default: false
  },
  wasAccepted: {
    type: Boolean,
    default: false
  },
  wasSanctioned: {
    type: Boolean,
    default: false
  },
  staffNotes: String,
  completionProofImage: String,
  comments: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['CITIZEN', 'STAFF', 'ADMIN'] },
    senderName: String,
    text: String,
    images: [String],
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

complaintSchema.index({ jurisdictionId: 1, status: 1 });
complaintSchema.index({ citizen: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
