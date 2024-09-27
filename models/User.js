// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },
        contacts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        avatar: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
