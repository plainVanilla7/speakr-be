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

        const io = req.app.get('io');
        io.to(conversationId).emit('newMessage', {
            id: message._id,  // Ensure id is sent to the client
            text: message.text,
            sender: message.sender,
            createdAt: message.createdAt
        });

        res.status(201).json({
            id: message._id,  // Send id in the response
            conversationId: message.conversationId,
            sender: message.sender,
            text: message.text,
            createdAt: message.createdAt,
        });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private

router.get('/:conversationId', authMiddleware, async (req, res) => {
    const { conversationId } = req.params;

    // Validate that conversationId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    try {
        const messages = await Message.find({ conversationId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });

        if (!messages.length) {
            return res.status(404).json({ message: 'No messages found for this conversation' });
        }

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
