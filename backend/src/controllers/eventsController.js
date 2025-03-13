const { InstagramScraper } = require("../utils/instagramScraper");
const { scrapeMultipleAccounts } = require("../utils/parallelScraper");
const { validateRequest } = require("../utils/validationHelpers");

// Get Instagram posts for multiple accounts in parallel
// Query: usernames, concurrency, postLimit, timeThreshold
// Returns: Object with posts from Instagram accounts
exports.getMultipleInstagramPosts = async (req, res) => {
  console.log("GET /api/events/instagram-multiple ", req.query);
  try {
    const { usernames, concurrency, postLimit, timeThreshold } = req.query;

    const validateResult = validateRequest(req);
    if (!validateResult.success) {
      return res.status(400).json(validateResult);
    }

    // Parse usernames from comma-separated string
    const usernameArray = usernames
      .split(",")
      .map((username) => username.trim());

    // Parse options
    const options = {
      concurrencyLimit: parseInt(concurrency) || 3,
      postLimit: parseInt(postLimit) || 10,
      timeout: 120000,
      timeThreshold: parseInt(timeThreshold) || 18,
    };

    // Scrape multiple Instagram accounts in parallel
    const response = await scrapeMultipleAccounts(
      usernameArray,
      validateResult.credentials,
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
