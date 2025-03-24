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
const User = require("../models/User");  // Import User model

// Get All Events
exports.getAllEvents = async (req, res) => {
    try {
        // Get the current user's ID from the JWT token
        const userId = req.user.userId;

        // Find all events that are either:
        // 1. AI-sourced events (source: 'ai')
        // 2. Custom events created by the current user (source: 'user' AND postedBy: userId)
        const events = await Event.find({
            $or: [
                { source: 'ai' },
                { source: 'user', postedBy: userId }
            ]
        }).populate("postedBy", "username email");
        
        // Format the response to match frontend expectations
        const formattedEvents = events.map(event => ({
            ...event.toObject(),
            _id: { $oid: event._id.toString() },
            postedBy: event.postedBy ? { $oid: event.postedBy._id.toString() } : null,
            baseEventId: event.baseEventId ? { $oid: event.baseEventId.toString() } : null,
            createdAt: event.createdAt ? { $date: event.createdAt.toISOString() } : undefined,
            updatedAt: event.updatedAt ? { $date: event.updatedAt.toISOString() } : undefined
        }));

        res.status(200).json(formattedEvents);
    } catch (error) {
        console.error('Error in getAllEvents:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create Event
exports.createEvent = async (req, res) => {
    try {
        const { name, date, time, location, caption, source, baseEventId, handle } = req.body;
        
        // Get the current user's ID from the JWT token
        const userId = req.user.userId;
        
        // Verify the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Create the new event
        const newEvent = await Event.create({
            name,
            date,
            time,
            location,
            caption,
            postedBy: userId,
            source: 'user',
            handle: handle || null
        });

        // Format the response to match frontend expectations
        const formattedEvent = {
            ...newEvent.toObject(),
            _id: { $oid: newEvent._id.toString() },
            postedBy: { $oid: userId.toString() },
            baseEventId: baseEventId ? { $oid: baseEventId.toString() } : null,
            createdAt: newEvent.createdAt ? { $date: newEvent.createdAt.toISOString() } : undefined,
            updatedAt: newEvent.updatedAt ? { $date: newEvent.updatedAt.toISOString() } : undefined
        };

        res.status(201).json({ message: "Event created successfully", event: formattedEvent });
    } catch (error) {
        console.error('Error in createEvent:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get Event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Format the response to match frontend expectations
        const formattedEvent = {
            ...event.toObject(),
            _id: { $oid: event._id.toString() },
            postedBy: event.postedBy ? { $oid: event.postedBy.toString() } : null,
            baseEventId: event.baseEventId ? { $oid: event.baseEventId.toString() } : null,
            createdAt: event.createdAt ? { $date: event.createdAt.toISOString() } : undefined,
            updatedAt: event.updatedAt ? { $date: event.updatedAt.toISOString() } : undefined
        };

        res.status(200).json(formattedEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Event
exports.updateEvent = async (req, res) => {
    try {
        const { handle, ...updateData } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id, 
            { ...updateData, handle: handle || null }, 
            { new: true }
        );
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Format the response to match frontend expectations
        const formattedEvent = {
            ...event.toObject(),
            _id: { $oid: event._id.toString() },
            postedBy: event.postedBy ? { $oid: event.postedBy.toString() } : null,
            baseEventId: event.baseEventId ? { $oid: event.baseEventId.toString() } : null,
            createdAt: event.createdAt ? { $date: event.createdAt.toISOString() } : undefined,
            updatedAt: event.updatedAt ? { $date: event.updatedAt.toISOString() } : undefined
        };

        res.status(200).json({ message: "Event updated successfully", event: formattedEvent });
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


// Natural Language Processing

// Key available in the discord, it hsa not yet been added to the server
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ChatGPT Request to extract event details from post caption.
async function extractEventDetails(text) {
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Extract event details as a structured JSON object with fields: name, date, time, location, caption. If no future event is found, return null. If any of the fields are not found, leave them blank, do not make up any information." },
                    { role: "user", content: text }
                ],
                temperature: 0,
                max_tokens: 200,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error("Error extracting event details:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Create Event from NLP
exports.createEventFromNLP = async (req, res) => {
    try {
        const { rawEventId } = req.params;

        // Fetch raw event data
        const rawEvent = await RawEvent.findById(rawEventId);
        if (!rawEvent) {
            return res.status(404).json({ error: "Raw event not found" });
        }

        // Extract event details using NLP
        const eventDetails = extractEventDetails(rawEvent.caption);
        if (!eventDetails) {
            return res.status(400).json({ error: "Failed to extract event details" });
        }

        // Create the new structured event
        const newEvent = new Event({
            name: eventDetails.name || "Untitled Event", // Ensures if there's no event name it still sets one
            date: eventDetails.date,
            time: eventDetails.time,
            location: eventDetails.location,
            caption: rawEvent.caption,
        });

        await newEvent.save();

        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};