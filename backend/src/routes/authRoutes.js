const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid credentials" });

        // Ensure the stored password is hashed before comparison
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});

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

            // Hash the password before storing it
            const hashedPassword = await bcrypt.hash(password, 10);

            user = new User({ name, email, password: hashedPassword });
            await user.save();

            res.status(201).json({ msg: "User registered successfully" });
        } catch (err) {
            res.status(500).json({ msg: "Server error", error: err.message });
        }
    }
);

module.exports = router;





