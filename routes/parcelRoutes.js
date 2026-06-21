const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET api/parcels/track/:trackingId
// @desc    Track a parcel by ID (Public)
// @access  Public
router.get('/track/:trackingId', async (req, res) => {
    try {
        const parcel = await Parcel.findOne({ trackingId: req.params.trackingId }).select('-createdBy');
        if (!parcel) {
            return res.status(404).json({ msg: 'Parcel not found. Please check your tracking ID.' });
        }
        res.json(parcel);
    } catch (err) {
        console.error('Error tracking parcel:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/parcels
// @desc    Create a new parcel
// @access  Admin Private
router.post('/', adminAuth, async (req, res) => {
    try {
        const { sender, recipient, destination, weight, currency, price, estimatedDeliveryDate, status, location } = req.body;

        const newParcel = new Parcel({
            sender,
            recipient,
            destination,
            weight,
            currency: currency || 'USD',
            price,
            estimatedDeliveryDate,
            status: status || 'Pending',
            createdBy: req.user.id
        });

        if (location) {
            newParcel.trackingHistory.push({
                status: status || 'Pending',
                location: location
            });
        }

        const parcel = await newParcel.save();
        res.json(parcel);
    } catch (err) {
        console.error('Error creating parcel:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/parcels
// @desc    Get all parcels (Admin)
// @access  Admin Private
router.get('/', adminAuth, async (req, res) => {
    try {
        const parcels = await Parcel.find().sort({ createdAt: -1 });
        res.json(parcels);
    } catch (err) {
        console.error('Error fetching parcels:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT api/parcels/:id
// @desc    Update a parcel
// @access  Admin Private
router.put('/:id', adminAuth, async (req, res) => {
    try {
        let parcel = await Parcel.findById(req.params.id);
        if (!parcel) return res.status(404).json({ msg: 'Parcel not found' });

        const { sender, recipient, destination, weight, currency, price, estimatedDeliveryDate, status, locationUpdate, statusUpdate } = req.body;
        
        if (sender) parcel.sender = sender;
        if (recipient) parcel.recipient = recipient;
        if (destination) parcel.destination = destination;
        if (weight) parcel.weight = weight;
        if (currency) parcel.currency = currency;
        if (price) parcel.price = price;
        if (estimatedDeliveryDate) parcel.estimatedDeliveryDate = estimatedDeliveryDate;
        if (status) parcel.status = status;

        if (locationUpdate && statusUpdate) {
            parcel.trackingHistory.push({
                status: statusUpdate,
                location: locationUpdate
            });
            // Update top-level status to reflect the latest tracking event
            parcel.status = statusUpdate;
        }

        await parcel.save();
        res.json(parcel);
    } catch (err) {
        console.error('Error updating parcel:', err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid parcel ID format' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE api/parcels/:id
// @desc    Delete a parcel
// @access  Admin Private
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        let parcel = await Parcel.findById(req.params.id);
        if (!parcel) return res.status(404).json({ msg: 'Parcel not found' });

        await Parcel.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Parcel removed' });
    } catch (err) {
        console.error('Error deleting parcel:', err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid parcel ID format' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
