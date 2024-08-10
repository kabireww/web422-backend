const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = await User.create({ username, password });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/protected', protect, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Add or remove from favorites
router.post('/favorites', protect, async (req, res) => {
    const userId = req.user._id;
    const { itemId } = req.body; // The ID of the item to add or remove

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the item is already in favorites
        const isFavorited = user.favorites.includes(itemId);

        if (isFavorited) {
            // Remove from favorites
            user.favorites = user.favorites.filter(favId => favId !== itemId);
            await user.save();
            return res.json({ message: 'Item removed from favorites', favorites: user.favorites });
        } else {
            // Add to favorites
            user.favorites.push(itemId);
            await user.save();
            return res.json({ message: 'Item added to favorites', favorites: user.favorites });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get the favorites list
router.get('/favorites', protect, async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
