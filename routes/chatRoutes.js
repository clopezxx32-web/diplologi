const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { auth, adminAuth } = require('../middleware/auth');

// POST /api/chat/join
router.post('/join', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ msg: 'Session ID required' });

        let chat = await Chat.findOne({ sessionId });
        if (!chat) {
            chat = new Chat({ sessionId, messages: [] });
            await chat.save();
        }
        res.json(chat.messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET /api/chat/admin/active
router.get('/admin/active', adminAuth, async (req, res) => {
    try {
        const chats = await Chat.find({ status: 'active' }).sort({ lastUpdated: -1 });
        res.json(chats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET /api/chat/:sessionId
router.get('/:sessionId', async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId });
        if (!chat) {
            return res.status(404).json({ msg: 'Chat not found' });
        }
        res.json(chat.messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// POST /api/chat/:sessionId/message
router.post('/:sessionId/message', async (req, res) => {
    try {
        const { sender, text } = req.body;
        const sessionId = req.params.sessionId;
        
        let chat = await Chat.findOne({ sessionId });
        if (!chat && sender === 'customer') {
            chat = new Chat({ sessionId, messages: [] });
        }
        
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });
        
        const newMessage = { sender, text, timestamp: new Date() };
        chat.messages.push(newMessage);
        chat.lastUpdated = new Date();
        await chat.save();
        
        res.json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
