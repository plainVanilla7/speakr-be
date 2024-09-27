// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Model
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
    '/register',
    [
        body('username', 'Username is required').not().isEmpty(),
        body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
        body('email', 'Invalid email').optional().isEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        try {
            // Check if username already exists
            let user = await User.findOne({ username });
            if (user) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // If email is provided, check if it's already in use
            if (email) {
                let emailUser = await User.findOne({ email });
                if (emailUser) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
            }

            // Create a new user
            user = new User({
                username,
                email, // This can be undefined if not provided
                password,
            });

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            // Save the user
            await user.save();

            // Create JWT payload
            const payload = {
                user: {
                    id: user.id,
                },
            };

            // Sign the token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: { id: user.id, username: user.username } });
                }
            );
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });

        // Create and return JWT
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username } });
            }
        );
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
