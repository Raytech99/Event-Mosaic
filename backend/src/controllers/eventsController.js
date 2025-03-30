// MAYA API BELOW -------------------------------------------------------

const Event = require("../models/Events");
const User = require("../models/User"); // Import User model

// Get All Events
exports.getAllEvents = async (req, res) => {
  try {
    // Get the current user's ID from the JWT token
    const userId = req.user.userId;

    // Find all events that are either:
    // 1. AI-sourced events (source: 'ai')
    // 2. Custom events created by the current user (source: 'user' AND postedBy: userId)
    const events = await Event.find({
      $or: [{ source: "ai" }, { source: "user", postedBy: userId }],
    }).populate("postedBy", "username email");

    // Format the response to match frontend expectations
    const formattedEvents = events.map((event) => ({
      ...event.toObject(),
      _id: { $oid: event._id.toString() },
      postedBy: event.postedBy ? { $oid: event.postedBy._id.toString() } : null,
      baseEventId: event.baseEventId
        ? { $oid: event.baseEventId.toString() }
        : null,
      createdAt: event.createdAt
        ? { $date: event.createdAt.toISOString() }
        : undefined,
      updatedAt: event.updatedAt
        ? { $date: event.updatedAt.toISOString() }
        : undefined,
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error in getAllEvents:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create Event
exports.createEvent = async (req, res) => {
  try {
    const { name, date, time, location, caption, source, baseEventId, handle } =
      req.body;

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
      source: "user",
      handle: handle || null,
    });

    // Format the response to match frontend expectations
    const formattedEvent = {
      ...newEvent.toObject(),
      _id: { $oid: newEvent._id.toString() },
      postedBy: { $oid: userId.toString() },
      baseEventId: baseEventId ? { $oid: baseEventId.toString() } : null,
      createdAt: newEvent.createdAt
        ? { $date: newEvent.createdAt.toISOString() }
        : undefined,
      updatedAt: newEvent.updatedAt
        ? { $date: newEvent.updatedAt.toISOString() }
        : undefined,
    };

    res
      .status(201)
      .json({ message: "Event created successfully", event: formattedEvent });
  } catch (error) {
    console.error("Error in createEvent:", error);
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
      baseEventId: event.baseEventId
        ? { $oid: event.baseEventId.toString() }
        : null,
      createdAt: event.createdAt
        ? { $date: event.createdAt.toISOString() }
        : undefined,
      updatedAt: event.updatedAt
        ? { $date: event.updatedAt.toISOString() }
        : undefined,
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
      baseEventId: event.baseEventId
        ? { $oid: event.baseEventId.toString() }
        : null,
      createdAt: event.createdAt
        ? { $date: event.createdAt.toISOString() }
        : undefined,
      updatedAt: event.updatedAt
        ? { $date: event.updatedAt.toISOString() }
        : undefined,
    };

    res
      .status(200)
      .json({ message: "Event updated successfully", event: formattedEvent });
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


