const mongoose = require('mongoose');

const citizenApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  citizenName: { type: String, required: true },
  citizenEmail: { type: String, required: true },
  complaintNumber: { type: String, required: true, trim: true },
  issue: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING_REVIEW', 'VIEWED'], default: 'PENDING_REVIEW' },
  viewedAt: Date,
  viewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CitizenApplication', citizenApplicationSchema);
