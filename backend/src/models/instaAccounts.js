const mongoose = require("mongoose");

const InstaAccountSchema = new mongoose.Schema({
    handle: { type: String, required: true, unique: true },
    events: { type: Array, default: [] }
});

module.exports = mongoose.model("InstaAccount", InstaAccountSchema, "instaAccounts");



