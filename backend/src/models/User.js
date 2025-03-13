const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
<<<<<<< HEAD
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    followedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "instAccount" }], 
    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
=======
  name: String,
  email: { type: String, unique: true },
  password: String,
>>>>>>> 607ed21c25300013e753fd8c4b67991fe42f9f65
});

module.exports = mongoose.model("User", UserSchema);




