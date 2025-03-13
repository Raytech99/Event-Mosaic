const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Register Route
<<<<<<< HEAD
const instAccount = require("../models/instaAccounts"); // Import the model

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

        const followedHandles = req.body.followedAccounts || []; // Get handles from request
        const followedAccounts = [];

        for (const handle of followedHandles) {
            const account = await instAccount.findOne({ handle }); // Find the account by handle
            if (account) {
                followedAccounts.push(account._id); // Store the ObjectId
            } else {
                return res.status(400).json({ msg: `Account ${handle} not found` });
            }
        }


        try {
            let existingUser = await User.findOne({ email });
            let existingUsername = await User.findOne({ username });

            if (existingUser) return res.status(400).json({ msg: "Email already in use" });
            if (existingUsername) return res.status(400).json({ msg: "Username already taken" });

            // Validate followedAccounts
            const validAccounts = await instAccount.find({ _id: { $in: followedAccounts } });

            if (validAccounts.length !== followedAccounts.length) {
                return res.status(400).json({ msg: "Some followed accounts are invalid" });
            }

            // Create new user
            const user = new User({
                firstName,
                lastName,
                username,
                email,
                password, // Password hashing is handled in the User model
                followedAccounts, // Store valid accounts
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
    const { emailOrUsername, password } = req.body;

    try {
        let user = await User.findOne({ 
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }
        
        //debugging comments 
        //console.log("Stored Hashed Password in MongoDB:", user.password);
        //console.log("Input Password Before Hashing:", password);

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
=======
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({
        success: false,
        msg: "Server configuration error",
        details: "JWT_SECRET missing",
      });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({ name, email, password }); // Store user in MongoDB
    await user.save();

    // Create and return JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      msg: "User registered successfully",
      token,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({
        success: false,
        msg: "Server configuration error",
        details: "JWT_SECRET missing",
      });
>>>>>>> 607ed21c25300013e753fd8c4b67991fe42f9f65
    }

    let user = await User.findOne({ email });
    if (!user || user.password !== password)
      return res.status(400).json({ msg: "Invalid credentials" });

    // Create and return JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err });
  }
});


module.exports = router;
<<<<<<< HEAD





=======
>>>>>>> 607ed21c25300013e753fd8c4b67991fe42f9f65
