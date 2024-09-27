// routes/messages.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Models
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

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

        // Update the conversation's updatedAt field
        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });

        // Emit the message to the conversation room
        const io = req.app.get('io');
        io.to(conversationId).emit('newMessage', message);
        console.log(`Message sent in conversation ${conversationId}:`, message);

        res.status(201).json(message);
    } catch (err) {
        console.error('Error sending message:', err);
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
            .populate('sender', 'username')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
