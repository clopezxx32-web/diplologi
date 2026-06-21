const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ParcelSchema = new mongoose.Schema({
    trackingId: { type: String, unique: true, default: () => `TRK-${uuidv4().split('-')[0].toUpperCase()}` },
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    destination: { type: String, required: true },
    weight: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'NGN'], default: 'USD' },
    price: { type: Number, required: true },
    estimatedDeliveryDate: { type: Date },
    trackingHistory: [
        {
            status: { type: String, required: true },
            location: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    status: { type: String, enum: ['Pending', 'In Transit', 'Delivered'], default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Admin who created it
}, { timestamps: true });

module.exports = mongoose.model('Parcel', ParcelSchema);
