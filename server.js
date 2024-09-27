// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests and puts the parsed data in req.body

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Body:`, req.body);
    next();
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leaveConversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, userId }) => {
        socket.to(conversationId).emit('typing', { userId });
        console.log(`User ${userId} is typing in conversation ${conversationId}`);
    });

    // Handle stop typing indicator
    socket.on('stopTyping', ({ conversationId, userId }) => {
        socket.to(conversationId).emit('stopTyping', { userId });
        console.log(`User ${userId} stopped typing in conversation ${conversationId}`);
    });

    // Handle message read receipt
    socket.on('messageRead', ({ conversationId, messageId, userId }) => {
        socket.to(conversationId).emit('messageRead', { messageId, userId });
        console.log(`User ${userId} read message ${messageId} in conversation ${conversationId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Database Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
