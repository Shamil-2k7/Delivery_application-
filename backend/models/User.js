const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'restaurant', 'delivery', 'admin'],
    default: 'user',
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      // Restaurants start as 'pending', others default to 'approved'
      return this.role === 'restaurant' ? 'pending' : 'approved';
    },
  },
  restaurantDetails: {
    name: { type: String, default: '' },
    cuisine: { type: String, default: '' },
    description: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
