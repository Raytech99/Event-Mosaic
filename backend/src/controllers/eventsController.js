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


// MAYA API BELOW -------------------------------------------------------

const Event = require("../models/Events");
const User = require("../models/User");  // Import User model

// Create Event
exports.createEvent = async (req, res) => {
  try {
      const { name, date, time, location, caption, postedBy } = req.body;

      // Check if postedBy is provided and valid
      let user = null;
      if (postedBy) {
          user = await User.findById(postedBy);
          if (!user) {
              return res.status(400).json({ error: "Invalid User ID" });
          }
      }

      // Create the new event
      const newEvent = new Event({
          name,
          date,
          time,
          location,
          caption,
          postedBy: user ? user._id : null  // Store user if exists
      });

      await newEvent.save();

      // If user exists, add the event ID to user's userEvents array
      if (user) {
          user.userEvents.push(newEvent._id);  // Store event in user's userEvents
          await user.save();
      }

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
        const { text } = req.body;
        const eventDetails = await extractEventDetails(text);

        if (!eventDetails) {
            return res.status(400).json({ error: "No valid future event found in text." });
        }

        // Create the event
        const newEvent = new Event(eventDetails);
        await newEvent.save();

        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

