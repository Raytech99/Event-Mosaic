const express = require("express");
const router = express.Router();
const {
  getMultipleInstagramPosts,
} = require("../controllers/eventsController");
const auth = require("../middleware/auth");

// Protect all routes with authentication
router.use(auth);

// Route to get Instagram posts for multiple accounts in parallel
router.get("/instagram-multiple", getMultipleInstagramPosts);

//MAYA API BELOW -----------------

const {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
} = require("../controllers/eventsController");

// Event CRUD Routes
router.post("/", createEvent); // Create event
router.get("/", getAllEvents); // Get all events
router.get("/:id", getEventById); // Get event by ID
router.put("/:id", updateEvent); // Update event
router.delete("/:id", deleteEvent); // Delete event

module.exports = router;
