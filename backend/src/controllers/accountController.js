const User = require("../models/User");
const InstagramAccount = require("../models/InstagramAccounts");
const { runScraper } = require("../utils/scheduler");

// Get accounts followed by the current user
// Returns: List of Instagram accounts followed by the user
exports.getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find accounts where this user is a follower
    const accounts = await InstagramAccount.find({ followers: userId });

    // Format response 
    const formattedAccounts = accounts.map((account) => ({
      username: account.username,
      lastScraped: account.lastScraped,
      postsCount: account.lastPosts ? account.lastPosts.length : 0,
    }));

    res.status(200).json({ success: true, accounts: formattedAccounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Follow a new Instagram account
// Body: { username: string }
// Returns: Account object
exports.followAccount = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) {
      return res
        .status(400)
        .json({ success: false, error: "Username is required" });
    }

    // Check if account already exists
    let account = await InstagramAccount.findOne({ username });

    // If not, create it
    if (!account) {
      console.log("Account not found, creating new account:", username);
      account = new InstagramAccount({ username });
    }

    // Add user to followers if not already following
    if (!account.followers.includes(userId)) {
      account.followers.push(userId);
    }

    await account.save();

    res.status(201).json({
      success: true,
      account: {
        username: account.username,
        active: account.active,
        lastScraped: account.lastScraped,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Unfollow an Instagram account
// Params: { username: string }
// Returns: Success message
exports.unfollowAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.id;

    const account = await InstagramAccount.findOne({ username });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, error: "Account not found" });
    }

    // Remove user from followers
    account.followers = account.followers.filter(
      (id) => id.toString() !== userId
    );

    // If no followers left, delete the account entirely
    if (account.followers.length === 0) {
      await InstagramAccount.findByIdAndDelete(account._id);
      return res.status(200).json({
        success: true,
        message: "Account unfollowed and removed from database",
      });
    } else {
      // Otherwise just save the updated followers list
      await account.save();
      return res.status(200).json({
        success: true,
        message: "Account unfollowed",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get latest posts for an account
// Params: { username: string }
// Returns: Posts from the specified account
exports.getAccountPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const account = await InstagramAccount.findOne({ username });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, error: "Account not found" });
    }

    res.json({
      success: true,
      username,
      lastScraped: account.lastScraped,
      posts: account.lastPosts || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all posts from followed accounts
// Returns: All posts from accounts followed by the user
exports.getAllFollowedPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all accounts followed by this user
    const accounts = await InstagramAccount.find({ followers: userId });

    // Collect all posts from followed accounts
    let allPosts = [];
    accounts.forEach((account) => {
      if (account.lastPosts && account.lastPosts.length > 0) {
        // Add username to each post
        const postsWithUsername = account.lastPosts.map((post) => ({
          ...post.toObject(),
          accountUsername: account.username,
        }));
        allPosts = allPosts.concat(postsWithUsername);
      }
    });

    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      count: allPosts.length,
      posts: allPosts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Manually trigger a scrape
exports.triggerScrape = async (req, res) => {
  try {
    // Return immediately to prevent timeout
    res.json({ success: true, message: "Scrape job started" });

    // Run the scraper in background
    runScraper().catch((err) => {
      console.error("Manual scrape failed:", err);
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
