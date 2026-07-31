const mongoose = require('mongoose');

const jurisdictionSchema = new mongoose.Schema({
  district: {
    type: String,
    required: true,
    trim: true
  },
  districtCode: {
    type: String,
    required: true,
    trim: true
  },
  block: {
    type: String,
    required: true,
    trim: true
  },
  blockCode: {
    type: String,
    required: true,
    trim: true
  },
  panchayat: {
    type: String,
    required: true,
    trim: true
  },
  panchayatCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['PANCHAYAT', 'MUNICIPALITY'],
    default: 'PANCHAYAT'
  },
  villages: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for fast hierarchy searches
jurisdictionSchema.index({ district: 1, block: 1, panchayat: 1 });

module.exports = mongoose.model('Jurisdiction', jurisdictionSchema);
