const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        user = new User({ name, email, password });  // Store user in MongoDB
        await user.save();

        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user || user.password !== password) return res.status(400).json({ msg: "Invalid credentials" });

        res.json({ msg: "Login successful" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err });
    }
});

module.exports = router;




