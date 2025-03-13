const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Register Route
router.post(
    "/register",
    [
        body("name").not().isEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Invalid email format"),
        body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) return res.status(400).json({ msg: "User already exists" });

            console.log("Received Plaintext Password:", password);

            // Password will be hashed inside of User.js
            user = new User({ name, email, password });

            await user.save(); // going to User.js for password hashing

            console.log("User saved successfully!");

            res.status(201).json({ msg: "User registered successfully" });
        } catch (err) {
            console.error("Registration Error:", err);
            res.status(500).json({ msg: "Server error", error: err.message });
        }
    }
);

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            console.log("User not found:", email);
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        //debugging comments 
        //console.log("Stored Hashed Password in MongoDB:", user.password);
        //console.log("Input Password Before Hashing:", password);

        // Compare input password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        console.log("Password Match Result:", isMatch);

        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});

module.exports = router;






