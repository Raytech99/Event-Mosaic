require("dotenv").config({ path: "../.env" }); // Adjust the path if needed
const mongoose = require("mongoose");
const instaAccounts = require("./models/instaAccounts"); // Adjust if needed
const connectDB = require("./db");

async function checkHandle() {
    await connectDB(); // Ensure DB connection

    const handle = "@psa_ucf";
    console.log(`🔍 Searching for handle: "${handle}"`);

    const account = await instaAccounts.findOne({ handle });

    if (account) {
        console.log("✅ Account found:", account);
    } else {
        console.log("❌ Account not found!");
    }

    mongoose.connection.close(); // Close connection after query
}

checkHandle();


