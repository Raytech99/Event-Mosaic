const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

// Hash password before saving, but only if it's not already hashed
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // Prevent double hashing

    console.log("🔍 Hashing password inside User model before saving...");

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("User", UserSchema);



