const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


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
        console.log("✅ Entered /register route. Body:", req.body);
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
              console.log("✅ Found account:", account._id);
              followedAccountIds.push(account._id);
            } else {
              console.log("❌ Account not found:", handle);
              return res.status(400).json({ msg: `Account ${handle} not found` });
            }
          }          
        
        console.log("📦 Request received, checking followed accounts...");

        try {
            console.log("📥 Registering new user...");

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

            const crypto = require("crypto");
            const sendEmail = require("../utils/sendEmail");

            const verificationToken = crypto.randomBytes(32).toString("hex");
            user.emailVerificationToken = verificationToken;
            await user.save();
            console.log("📄 Saving user to DB...");
            
            const verifyLink = `http://142.93.178.54/api/auth/verify-email?token=${verificationToken}&email=${user.email}`;
            
            await sendEmail({
              to: user.email,
              subject: "Verify your email",
              html: `
                <p>Hi ${user.firstName},</p>
                <p>Thanks for signing up for Event Mosaic!</p>
                <p>Please <a href="${verifyLink}">click here to verify your email</a>.</p>
              `,
            });
            console.log("✅ Verification email sent to", user.email);

            
            res.status(201).json({ msg: "Verification email sent. Please check your inbox." });

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

        if (!user.emailVerified) {
            return res.status(401).json({ msg: "Please verify your email before logging in." });
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

//Verify Email
router.get("/verify-email", async (req, res) => {
    const { token, email } = req.query;
  
    const user = await User.findOne({ email, emailVerificationToken: token });
    if (!user) return res.status(400).json({ msg: "Invalid or expired token." });
  
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  
    res.json({ msg: "Email verified successfully. You can now log in." });
  });
  
  //Forgot Password
  const crypto = require("crypto");
  
  router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 3600000; // 1 hour

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;
  await user.save();

  const resetLink = `http://eventmosaic.net/api/auth/reset-password?token=${token}&email=${email}`;

  await sendEmail({
    to: email,
    subject: "Reset Your Password",
    html: `
      <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
      <p>This link will expire in 1 hour.</p>
    `
  });

  res.json({ msg: "Password reset email sent" });
});

//Reset Password
router.post("/reset-password", async (req, res) => {
    const { email, token, newPassword } = req.body;
  
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // not expired
    });
  
    if (!user) return res.status(400).json({ msg: "Invalid or expired token" });
  
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  
    res.json({ msg: "Password updated successfully" });
  });

  



