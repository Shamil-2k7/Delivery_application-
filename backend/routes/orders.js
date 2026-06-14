const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Food = require('../models/Food');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private/User
router.post('/', protect, authorize('user'), async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, phone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Calculate total amount and verify items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const foodItem = await Food.findById(item.foodId);
      if (!foodItem) {
        return res.status(404).json({ success: false, message: `Food item ${item.foodId} not found` });
      }

      if (foodItem.restaurant.toString() !== restaurantId) {
        return res.status(400).json({
          success: false,
          message: `Item ${foodItem.name} does not belong to the selected restaurant`,
        });
      }

      const price = foodItem.price;
      totalAmount += price * item.quantity;

      orderItems.push({
        food: item.foodId,
        quantity: item.quantity,
        price: price,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      phone,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/user
// @desc    Get current user's orders
// @access  Private/User
router.get('/user', protect, authorize('user'), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name restaurantDetails')
      .populate('deliveryPartner', 'name phone')
      .populate('items.food', 'name image')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/restaurant
// @desc    Get restaurant's orders
// @access  Private/Restaurant
router.get('/restaurant', protect, authorize('restaurant'), async (req, res) => {
  try {
    const orders = await Order.find({ restaurant: req.user._id })
      .populate('user', 'name phone')
      .populate('deliveryPartner', 'name phone')
      .populate('items.food', 'name image')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/delivery/available
// @desc    Get orders ready for delivery pickup
// @access  Private/Delivery
router.get('/delivery/available', protect, authorize('delivery'), async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'ready_for_pickup',
      deliveryPartner: null,
    })
      .populate('restaurant', 'name address phone restaurantDetails')
      .populate('user', 'name phone')
      .populate('items.food', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/delivery/assigned
// @desc    Get delivery partner's current and past orders
// @access  Private/Delivery
router.get('/delivery/assigned', protect, authorize('delivery'), async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate('restaurant', 'name address phone restaurantDetails')
      .populate('user', 'name phone')
      .populate('items.food', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/orders/:id/accept-delivery
// @desc    Accept delivery request (Delivery partner only)
// @access  Private/Delivery
router.put('/:id/accept-delivery', protect, authorize('delivery'), async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'ready_for_pickup') {
      return res.status(400).json({ success: false, message: 'Order is not ready for pickup' });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({ success: false, message: 'Order already accepted by another driver' });
    }

    order.deliveryPartner = req.user._id;
    order.status = 'out_for_delivery';
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Role check controls
    if (req.user.role === 'restaurant') {
      // Restaurant can accept, prepare, and set ready
      if (order.restaurant.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this restaurant' });
      }

      const allowedStatuses = ['accepted', 'preparing', 'ready_for_pickup', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status update for Restaurant' });
      }
    } else if (req.user.role === 'delivery') {
      // Delivery partner can mark out_for_delivery (if assigned) or delivered
      if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized: another driver is assigned' });
      }

      const allowedStatuses = ['out_for_delivery', 'delivered'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status update for Delivery Partner' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to change order status' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
