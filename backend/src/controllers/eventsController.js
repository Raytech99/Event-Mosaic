const { InstagramScraper } = require("../utils/instagramScraper");
const { scrapeMultipleAccounts } = require("../utils/parallelScraper");

// Check if Instagram credentials are configured on server
function checkCredentials() {
  const credentials = {
    username: process.env.INSTAGRAM_USERNAME,
    password: process.env.INSTAGRAM_PASSWORD,
  };

  if (!credentials.username || !credentials.password) {
    return false;
  }

  return credentials;
}

// Validate request parameters for Instagram scraper
function validateRequest(req) {
  const { usernames, concurrency, postLimit, timeThreshold } = req.query;

  const credentials = checkCredentials();

  if (!credentials) {
    return {
      success: false,
      message: "Instagram credentials not configured on server",
    };
  }

  if (!usernames) {
    return {
      success: false,
      message: "Instagram usernames are required",
    };
  }

  if (
    concurrency &&
    (isNaN(parseInt(concurrency)) ||
      parseInt(concurrency) < 1 ||
      parseInt(concurrency) > 4)
  ) {
    // Check if concurrency is a number and between 1 and 4
    return {
      success: false,
      message: "Invalid concurrency limit",
    };
  }

  if (
    postLimit &&
    (isNaN(parseInt(postLimit)) ||
      parseInt(postLimit) < 1 ||
      parseInt(postLimit) > 10)
  ) {
    // Check if post limit is a number and between 1 and 10
    return {
      success: false,
      message: "Invalid post limit",
    };
  }

  if (
    timeThreshold &&
    (isNaN(parseInt(timeThreshold)) ||
      parseInt(timeThreshold) < 1 ||
      parseInt(timeThreshold) > 36)
  ) {
    // Check if time threshold is a number and between 1 and 36
    return {
      success: false,
      message: "Invalid time threshold",
    };
  }

  return {
    success: true,
    credentials,
  };
}

// Get Instagram posts for multiple accounts in parallel
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

// Scrape Instagram posts for a single account (deprecated)
exports.getInstagramPosts = async (req, res) => {
  console.log("GET /api/events/instagram/:username ", req.params);
  try {
    const { username, concurrency, postLimit, timeThreshold } = req.query;

    const validateResult = validateRequest(req);
    if (!validateResult.success) {
      return res.status(400).json(validateResult);
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


// MAYA API BELOW -------------------------------------------------------

const Event = require("../models/Events");

// Create Event
exports.createEvent = async (req, res) => {
    try {
        const { name, date, time, location, caption, postedBy } = req.body;
        const newEvent = new Event({ name, date, time, location, caption, postedBy });
        await newEvent.save();
        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate("postedBy", "username email");
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Event
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.status(200).json({ message: "Event updated successfully", event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
