const cron = require("node-cron");
const { scrapeMultipleAccounts } = require("./parallelScraper");
const mongoose = require("mongoose");
require("dotenv").config();
const { checkCredentials } = require("./validationHelpers");

const InstagramAccount = mongoose.model("InstagramAccount");

async function runScraper() {
  console.log("Starting scheduled Instagram scrape...");

  try {
    // Get all active accounts
    const accounts = await InstagramAccount.find({});

    if (accounts.length === 0) {
      console.log("No accounts to scrape");
      return;
    }

    const usernames = accounts.map((account) => account.username);
    console.log(
      `Scraping ${usernames.length} accounts: ${usernames.join(", ")}`
    );

    const credentials = checkCredentials();

    if (!credentials) {
      return {
        success: false,
        message: "Instagram credentials not configured on server",
      };
    }

    // Run the scraper
    const options = {
      concurrencyLimit: 2,
      timeThreshold: 24,
      postLimit: 10,
    };

    const results = await scrapeMultipleAccounts(
      usernames,
      credentials,
      options
    );

    // Update accounts with latest posts
    for (const result of results.data) {
      if (result.success && result.posts && result.posts.length > 0) {
        // Filter posts to include only the fields we want
        const simplifiedPosts = result.posts.map((post) => ({
          url: post.url,
          date: post.date,
          caption: post.caption,
          imageUrl: post.imageUrl,
        }));

        await InstagramAccount.findOneAndUpdate(
          { username: result.username },
          {
            lastScraped: new Date(),
            lastPosts: simplifiedPosts,
          }
        );
      }
    }

    console.log(`Scrape completed successfully`);
  } catch (error) {
    console.error("Error in scheduler:", error);
  }
}

// Schedule the scraper to run daily at midnight
function initScheduler() {
  cron.schedule("0 0 * * *", runScraper);
  console.log("Instagram scraper scheduled to run daily at midnight");

  return { runScraper };
}

module.exports = { initScheduler, runScraper };
