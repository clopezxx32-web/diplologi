require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Chat = require('./models/Chat');
const chatRoutes = require('./routes/chatRoutes');

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
app.use('/api/chat', chatRoutes);

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
