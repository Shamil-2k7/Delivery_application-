const express = require('express');
const router = express.Router();
const Food = require('../models/Food');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/foods/restaurants
// @desc    Get all approved restaurants
// @access  Public (or customer)
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await User.find({ role: 'restaurant', status: 'approved' }).select('-password');
    res.json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/foods/restaurant/:restaurantId
// @desc    Get all foods for a specific restaurant
// @access  Public
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const foods = await Food.find({ restaurant: req.params.restaurantId, isAvailable: true });
    res.json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/foods
// @desc    Get all foods
// @access  Public
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find({ isAvailable: true }).populate('restaurant', 'name restaurantDetails');
    res.json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/foods
// @desc    Add a new food item (Restaurant only)
// @access  Private/Restaurant
router.post('/', protect, authorize('restaurant'), async (req, res) => {
  try {
    // Check if the restaurant is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant has not been approved by the admin yet',
      });
    }

    const { name, description, price, category, image } = req.body;

    const food = await Food.create({
      name,
      description,
      price,
      category,
      image: image || '',
      restaurant: req.user._id,
    });

    res.status(201).json({ success: true, data: food });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/foods/:id
// @desc    Update a food item (Owner Restaurant only)
// @access  Private/Restaurant
router.put('/:id', protect, authorize('restaurant'), async (req, res) => {
  try {
    let food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    // Verify ownership
    if (food.restaurant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item',
      });
    }

    food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: food });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/foods/:id
// @desc    Delete a food item (Owner Restaurant only)
// @access  Private/Restaurant
router.delete('/:id', protect, authorize('restaurant'), async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    // Verify ownership
    if (food.restaurant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item',
      });
    }

    await Food.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Food item removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
