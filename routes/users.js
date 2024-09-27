// routes/users.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/users/contacts
// @desc    Get authenticated user's contacts
// @access  Private
router.get('/contacts', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('contacts', 'username avatar');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/contacts
// @desc    Add a new contact
// @access  Private
router.post('/contacts', authMiddleware, async (req, res) => {
    const { contactId } = req.body;

    // Validate contactId
    if (!contactId) {
        return res.status(400).json({ message: 'Contact ID is required' });
    }

    try {
        // Prevent adding oneself
        if (contactId === req.user.id) {
            return res.status(400).json({ message: 'Cannot add yourself as a contact' });
        }

        // Check if contact exists
        const contactUser = await User.findById(contactId);
        if (!contactUser) {
            return res.status(404).json({ message: 'Contact user not found' });
        }

        // Get authenticated user
        const user = await User.findById(req.user.id);

        // Check if contact is already added
        if (user.contacts.includes(contactId)) {
            return res.status(400).json({ message: 'User is already a contact' });
        }

        // Add contact
        user.contacts.push(contactId);
        await user.save();

        res.status(200).json({ message: 'Contact added successfully' });
    } catch (error) {
        console.error('Error adding contact:', error);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/users/search?query=
// @desc    Search users by username
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        // Search for users whose username contains the query string, case-insensitive
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.id }, // Exclude the authenticated user
        }).select('username avatar');

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
