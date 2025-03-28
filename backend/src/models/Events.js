const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    caption: { type: String },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    source: { type: String, enum: ['ai', 'user'], default: 'user' },
    baseEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    handle: { type: String } // Club handle/name that posted the event
}, { timestamps: true });

module.exports = mongoose.model("Event", EventSchema, "events");
