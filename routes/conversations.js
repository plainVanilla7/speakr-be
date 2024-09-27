// routes/conversations.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Models
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @route   POST /api/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { recipientId } = req.body;

    try {
        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, recipientId] },
        });

        if (conversation) return res.status(200).json(conversation);

        // Create new conversation
        conversation = new Conversation({
            participants: [req.user.id, recipientId],
        });

        await conversation.save();
        console.log(`New conversation created:`, conversation);

        res.status(201).json(conversation);
    } catch (err) {
        console.error('Error creating conversation:', err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
        })
            .populate('participants', 'username')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
