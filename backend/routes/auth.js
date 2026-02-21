/**
 * Auth Routes
 * POST /api/auth/login  - User login
 * POST /api/auth/logout - User logout
 */

const express = require('express');
const router = express.Router();
const { userStore } = require('../data/users');

router.post('/login', (req, res) => {
    const { upiId, password } = req.body;

    if (!upiId || !password) {
        return res.status(400).json({ success: false, error: 'UPI ID and password are required' });
    }

    const user = userStore.find(u => u.upiId === upiId && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid UPI ID or password' });
    }

    // In production: generate and return a JWT
    const token = `mock-jwt-token-for-${user.id}`;

    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token
    });
});

router.post('/logout', (req, res) => {
    return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
