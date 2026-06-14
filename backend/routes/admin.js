const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// Make sure all routes below are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/restaurants/pending
// @desc    Get all restaurants waiting for approval
// @access  Private/Admin
router.get('/restaurants/pending', async (req, res) => {
  try {
    const pendingRestaurants = await User.find({
      role: 'restaurant',
      status: 'pending',
    }).select('-password');
    res.json({ success: true, data: pendingRestaurants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/restaurants/:id/approve
// @desc    Approve restaurant registration
// @access  Private/Admin
router.put('/restaurants/:id/approve', async (req, res) => {
  try {
    const restaurant = await User.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (restaurant.role !== 'restaurant') {
      return res.status(400).json({ success: false, message: 'Selected user is not a restaurant' });
    }

    restaurant.status = 'approved';
    await restaurant.save();

    res.json({ success: true, message: 'Restaurant approved successfully', data: restaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/restaurants/:id/reject
// @desc    Reject restaurant registration
// @access  Private/Admin
router.put('/restaurants/:id/reject', async (req, res) => {
  try {
    const restaurant = await User.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (restaurant.role !== 'restaurant') {
      return res.status(400).json({ success: false, message: 'Selected user is not a restaurant' });
    }

    restaurant.status = 'rejected';
    await restaurant.save();

    res.json({ success: true, message: 'Restaurant rejected successfully', data: restaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users list
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders list
// @access  Private/Admin
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('restaurant', 'name restaurantDetails')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
