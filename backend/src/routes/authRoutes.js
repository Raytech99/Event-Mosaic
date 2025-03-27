const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Register Route
const instaAccounts = require("../models/instaAccounts"); // Import the model

router.post(
    "/register",
    [
        body("firstName").not().isEmpty().withMessage("First name is required"),
        body("lastName").not().isEmpty().withMessage("Last name is required"),
        body("username").not().isEmpty().withMessage("Username is required"),
        body("email").isEmail().withMessage("Invalid email format"),
        body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
        body("followedAccounts").isArray().withMessage("Followed accounts must be an array"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, username, email, password, followedAccounts } = req.body;

        const followedHandles = followedAccounts || [];
        const followedAccountIds = [];

        for (const handle of followedHandles) {
            console.log("🔍 Searching for handle:", handle);

            const account = await instaAccounts.findOne({ handle });
            if (account) {
                console.log("Account found:", account._id);
                followedAccountIds.push(account._id);
            } else {
                console.log("Account not found:", handle);
                return res.status(400).json({ msg: `Account ${handle} not found` });
            }
        }

        try {
            let existingUser = await User.findOne({ email });
            let existingUsername = await User.findOne({ username });

            if (existingUser) return res.status(400).json({ msg: "Email already in use" });
            if (existingUsername) return res.status(400).json({ msg: "Username already taken" });

            // Validate followedAccounts
            const validAccounts = await instaAccounts.find({ _id: { $in: followedAccountIds } });

            if (validAccounts.length !== followedAccountIds.length) {
                return res.status(400).json({ msg: "Some followed accounts are invalid" });
            }

            // Create new user
            const user = new User({
                firstName,
                lastName,
                username,
                email,
                password,
                followedAccounts: [] //empty array
            });

            await user.save();

            res.status(201).json({ msg: "User registered successfully" });
        } catch (err) {
            console.error("Registration Error:", err);
            res.status(500).json({ msg: "Server error", error: err.message });
        }
    }
);




// Login Route
router.post("/login", async (req, res) => {
    console.log("Received login request body:", req.body);  // Add this line to log the incoming request
    const { emailOrUsername, password } = req.body;

    try {
        console.log("Login attempt for:", emailOrUsername);
        
        let user = await User.findOne({ 
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        });

        if (!user) {
            console.log("No user found with email/username:", emailOrUsername);
            return res.status(400).json({ msg: "Invalid credentials" });
        }
        
        console.log("User found:", {
            id: user._id,
            email: user.email,
            username: user.username
        });

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch);

        if (!isMatch) {
            console.log("Password mismatch for user:", emailOrUsername);
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log("Login successful, token generated");

        res.json({ 
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                id: user._id
            }
        });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});


module.exports = router;





