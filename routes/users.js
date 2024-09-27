// routes/users.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/users/contacts
// @desc    Get user's contacts
// @access  Private
router.get('/contacts', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('contacts', 'username');
        res.json(user.contacts);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/contacts
// @desc    Add a contact
// @access  Private
router.post('/contacts', authMiddleware, async (req, res) => {
    const { contactId } = req.body;

    try {
        const user = await User.findById(req.user.id);

        // Check if contact already exists
        if (user.contacts.includes(contactId)) {
            return res.status(400).json({ message: 'Contact already exists' });
        }

        user.contacts.push(contactId);
        await user.save();

        const updatedContacts = await User.findById(req.user.id).populate('contacts', 'username');
        res.status(201).json(updatedContacts.contacts);
    } catch (err) {
        console.error('Error adding contact:', err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/users/search
// @desc    Search for users
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
    const { query } = req.query;

    try {
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.id },
        }).select('username');

        res.json(users);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
