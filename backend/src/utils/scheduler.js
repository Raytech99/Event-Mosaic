const cron = require("node-cron");
const { scrapeMultipleAccounts } = require("./parallelScraper");
const { checkCredentials } = require("./validationHelpers");
const InstaAccount = require("../models/instaAccounts");
const Event = require("../models/Events");

async function runScraper() {
  console.log("Starting scheduled Instagram scrape...");

  try {
    // Get all Instagram accounts
    const accounts = await InstaAccount.find({});
    // console.log("\nAccounts found: ", accounts.length);
    console.log(" Accounts: ", JSON.stringify(accounts, null, 2));

    if (accounts.length === 0) {
      console.log("No Instagram accounts to scrape");
      return { success: false, message: "No accounts to scrape" };
    }

    // Extract handles from accounts
    const usernames = accounts.map((account) => account.handle);
    console.log(
      `Scraping ${usernames.length} accounts: ${usernames.join(", ")}`
    );

    // Get Instagram credentials
    const credentials = checkCredentials();
    if (!credentials) {
      console.log("Instagram credentials not configured on server");
      return {
        success: false,
        message: "Instagram credentials not configured on server",
      };
    }

    // Run the scraper
    const options = {
      concurrencyLimit: 3,
      timeThreshold: 24,
      postLimit: 10,
    };

    // Get raw data from Instagram
    const results = await scrapeMultipleAccounts(
      usernames,
      credentials,
      options
    );

    console.log("Scraping results: ", JSON.stringify(results, null, 2));

    let totalEventsCreated = 0;

    // Process each Instagram account's results
    for (const result of results.data) {
      if (result.success && result.posts && result.posts.length > 0) {
        console.log(
          `Processing ${result.posts.length} posts from ${result.username}`
        );

        // Find the corresponding InstaAccount document
        const account = await InstaAccount.findOne({ handle: result.username });
        if (!account) {
          console.log(`Account not found for handle: ${result.username}`);
          continue;
        }

        // Keep track of new event IDs
        const newEventIds = [];

        // Process each post
        for (const post of result.posts) {
          // Check if this post already exists as an event
          const existingEvent = await Event.findOne({
            caption: post.caption,
            handle: result.username,
          });

          if (existingEvent) {
            console.log(
              `Event already exists for post from ${result.username}`
            );
            newEventIds.push(existingEvent._id);
            continue;
          }

          // TODO: Integrate AI model here to extract event details from caption

          // Extract post date and format for event
          const eventDate = formatDate(post.date);
          const eventTime = formatTime(post.date);

          // Create new Event document with N/A defaults
          const newEvent = new Event({
            name: "N/A",
            date: eventDate,
            time: eventTime,
            location: "N/A",
            caption: post.caption,
            source: "ai",
            handle: result.username,
          });

          // Save the new event
          await newEvent.save();
          console.log(
            `Created new event for ${result.username} with default values`
          );

          // Add the new event ID to our list
          newEventIds.push(newEvent._id);
          totalEventsCreated++;
        }

        // Update the InstaAccount document with the new event IDs
        const currentEvents = account.events || [];
        account.events = [...currentEvents, ...newEventIds];
        await account.save();

        console.log(
          `Updated account ${result.username} with ${newEventIds.length} new events`
        );
      }
    }

    console.log(`Scrape completed. Created ${totalEventsCreated} new events.`);
    return {
      success: true,
      eventsCreated: totalEventsCreated,
      accountsProcessed: results.data.filter((r) => r.success).length,
    };
  } catch (error) {
    console.error("Error in scheduler:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper functions for date and time formatting
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toTimeString().split(" ")[0].substring(0, 5); // HH:MM
}

// Schedule the scraper to run daily at midnight
function initScheduler() {
  const job = cron.schedule("0 0 * * *", runScraper);
  console.log("Instagram scraper scheduled to run daily at midnight");
  return { job, runScraper };
}

module.exports = { initScheduler, runScraper };
