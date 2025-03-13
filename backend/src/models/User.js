const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

// Ensure password is only hashed once
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    console.log("Hashing password inside User model");
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("User", UserSchema);


