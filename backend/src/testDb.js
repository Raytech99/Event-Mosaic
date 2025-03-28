require("dotenv").config({ path: "../.env" }); // Adjust the path if needed
const mongoose = require("mongoose");
const instaAccounts = require("./models/instaAccounts");
const connectDB = require("./db");

async function checkHandle() {
    await connectDB();

    console.log("🔍 Connected to database:", mongoose.connection.name);

    // Show all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📂 Collections:", collections.map(c => c.name));

    console.log("🔍 Fetching all stored Instagram accounts...");
    const allAccounts = await instaAccounts.find({});
    console.log("📜 Stored accounts:", allAccounts);

    const handle = "@psa_ucf";
    console.log(`🔍 Searching for handle: "${handle}"`);

    const account = await instaAccounts.findOne({ handle });

    if (account) {
        console.log("✅ Account found:", account);
    } else {
        console.log("❌ Account not found!");
    }

    mongoose.connection.close();
}

checkHandle();
;



