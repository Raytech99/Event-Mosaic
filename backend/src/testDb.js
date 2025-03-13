require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const instaAccounts = require("./models/instaAccounts"); // Adjust path if needed
const connectDB = require("./db"); // Ensure database connection

async function checkHandle() {
    await connectDB(); // Ensure DB connection
    
    const handle = "@psa_ucf";
    const account = await instaAccounts.findOne({ handle });

    console.log("Query result:", account);

    mongoose.connection.close(); // Close connection after query
}

checkHandle();
