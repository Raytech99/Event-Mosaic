const { InstagramScraper } = require("../utils/instagramScraper");
const { scrapeMultipleAccounts } = require("../utils/parallelScraper");

// Get Instagram posts for an event
exports.getInstagramPosts = async (req, res) => {
  console.log("GET /api/events/instagram/:username ", req.params);
  try {
    const { username } = req.params;
    const { timeThreshold = 12 } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Instagram username is required",
      });
    }

    // Get credentials from environment variables
    const credentials = {
      username: process.env.INSTAGRAM_USERNAME,
      password: process.env.INSTAGRAM_PASSWORD,
    };

    // Check if credentials are available
    if (!credentials.username || !credentials.password) {
      return res.status(500).json({
        success: false,
        message: "Instagram credentials not configured on server",
      });
    }

    const scraper = new InstagramScraper(credentials);
    const result = await scraper.scrapeProfile(username, {
      timeThreshold: parseInt(timeThreshold),
      postLimit: 10,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json({
      success: true,
      count: result.posts.length,
      timeThreshold: parseInt(timeThreshold),
      timeframe: `Posts from the last ${timeThreshold} hours`,
      data: result.posts,
    });
  } catch (error) {
    console.error("Error in Instagram scraper controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error scraping Instagram posts",
    });
  }
};

// Get Instagram posts for multiple accounts in parallel
exports.getMultipleInstagramPosts = async (req, res) => {
  console.log("GET /api/events/instagram-multiple ", req.query);
  try {
    const { usernames, concurrency, postLimit, timeThreshold } = req.query;

    if (!usernames) {
      return res.status(400).json({
        success: false,
        message: "Instagram usernames are required",
      });
    }

    // Parse usernames from comma-separated string
    const usernameArray = usernames
      .split(",")
      .map((username) => username.trim());

    // Parse options
    const options = {
      concurrencyLimit: parseInt(concurrency) || 5,
      postLimit: parseInt(postLimit) || 10,
      timeout: 120000,
      timeThreshold: parseInt(timeThreshold) || 12,
    };

    // Get credentials from environment variables
    const credentials = {
      username: process.env.INSTAGRAM_USERNAME,
      password: process.env.INSTAGRAM_PASSWORD,
    };

    // Check if credentials are available
    if (!credentials.username || !credentials.password) {
      return res.status(500).json({
        success: false,
        message: "Instagram credentials not configured on server",
      });
    }

    // Scrape multiple Instagram accounts in parallel
    const response = await scrapeMultipleAccounts(
      usernameArray,
      credentials,
      options
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in parallel Instagram scraper controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error scraping multiple Instagram accounts",
    });
  }
};
