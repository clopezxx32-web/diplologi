require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const Chat = require('./models/Chat');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});


const authRoutes = require('./routes/authRoutes');
const parcelRoutes = require('./routes/parcelRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);

// Fallback for SPA (if they try to refresh dashboard.html)
app.get('/:page', (req, res) => {
    const validPages = ['dashboard.html', 'index.html'];
    if (validPages.includes(req.params.page)) {
        res.sendFile(path.join(__dirname, 'public', req.params.page));
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Global Error Handler caught:', err);
    res.status(err.status || 500).json({
        msg: err.message || 'Internal Server Error'
    });
});

// Socket.io Implementation
io.on('connection', (socket) => {
    socket.on('join_chat', async (sessionId) => {
        socket.join(sessionId);
        try {
            let chat = await Chat.findOne({ sessionId });
            if (!chat) {
                chat = new Chat({ sessionId, messages: [] });
                await chat.save();
            }
            socket.emit('chat_history', chat.messages);
            io.to('admin_room').emit('active_chats_update');
        } catch (err) {
            console.error('Error joining chat:', err);
        }
    });

    socket.on('admin_join', () => {
        socket.join('admin_room');
    });

    socket.on('fetch_active_chats', async () => {
        try {
            const chats = await Chat.find({ status: 'active' }).sort({ lastUpdated: -1 });
            socket.emit('active_chats_list', chats);
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('send_message', async (data) => {
        const { sessionId, sender, text } = data;
        try {
            let chat = await Chat.findOne({ sessionId });
            if (!chat && sender === 'customer') {
                chat = new Chat({ sessionId, messages: [] });
            }
            if (chat) {
                const newMessage = { sender, text, timestamp: new Date() };
                chat.messages.push(newMessage);
                chat.lastUpdated = new Date();
                await chat.save();
                
                io.to(sessionId).emit('receive_message', newMessage);
                io.to('admin_room').emit('active_chats_update');
                io.to('admin_room').emit('admin_receive_message', { sessionId, message: newMessage });
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app, server };
