const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");


//MAYA API BELOW -----------------

const {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
} = require("../controllers/eventsController");

// Event CRUD Routes
router.post("/", auth, createEvent); // Create event
router.get("/", auth, getAllEvents); // Get all events
router.get("/:id", auth, getEventById); // Get event by ID
router.put("/:id", auth, updateEvent); // Update event
router.delete("/:id", auth, deleteEvent); // Delete event

module.exports = router;
