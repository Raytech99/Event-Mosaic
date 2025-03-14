const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    followedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "instaAccounts" }], 
    userEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],  // Store events created by user
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("User", UserSchema);




