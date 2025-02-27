const { scrapeInstagramPosts } = require("../utils/instagramScraper");

// Get Instagram posts for an event
exports.getInstagramPosts = async (req, res) => {
  console.log("GET /api/events/instagram/:username ", req.params);
  try {
    const { username } = req.params;

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

    // Scrape Instagram posts
    const result = await scrapeInstagramPosts(username, credentials);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json({
      success: true,
      count: result.posts.length,
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
