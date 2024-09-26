// routes/messages.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Models
const Message = require('../models/Message');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { conversationId, text } = req.body;

    try {
        const message = new Message({
            conversationId,
            sender: req.user.id,
            text,
        });

        await message.save();

        // Emit the message to the conversation room
        const io = req.app.get('io');
        io.to(conversationId).emit('newMessage', message);

        res.status(201).json(message);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId,
        })
            .populate('sender', 'name')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
