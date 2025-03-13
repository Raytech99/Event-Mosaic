const mongoose = require("mongoose");

const InstAccountSchema = new mongoose.Schema({
    handle: { type: String, required: true, unique: true },
    events: { type: Array, default: [] },
});

module.exports = mongoose.model("InstAccount", InstAccountSchema);
