const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = require("../db");
const { runScraper } = require("../utils/scheduler");

async function testScheduler() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Starting scheduler test...");
    const result = await runScraper();
    console.log("\n\nTest results:");
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    console.log(`Success: ${result.success}`);
    console.log(`Events created: ${result.eventsCreated || 0}`);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
}

testScheduler();
