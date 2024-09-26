// routes/conversations.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Models
const Conversations = require('../models/Conversation');

// @route   POST /api/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { recipientId } = req.body;

    try {
        // Check if conversation exists
        let conversation = await Conversations.findOne({
            participants: { $all: [req.user.id, recipientId] },
        });

        if (conversation) return res.status(200).json(conversation);

        // Create new conversation
        conversation = new Conversations({
            participants: [req.user.id, recipientId],
        });

        await conversation.save();
        res.status(201).json(conversation);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET /api/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversations.find({
            participants: req.user.id,
        })
            .populate('participants', 'name')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
