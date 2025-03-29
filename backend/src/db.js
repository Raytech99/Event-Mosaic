const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "EventMosaic",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected...");
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err);
        process.exit(1);
    }
};

module.exports = connectDB;

