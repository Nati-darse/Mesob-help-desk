const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  amharicName: {
    type: String,
    default: ''
  },
  initials: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#1976d2'
  },
  maxUsers: {
    type: Number,
    default: 100
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', companySchema);
