const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  fromStatus: {
    type: String,
    required: true
  },
  toStatus: {
    type: String,
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorRole: {
    type: String,
    required: true
  },
  actorName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
