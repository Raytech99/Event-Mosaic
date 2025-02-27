const express = require("express");
const router = express.Router();
const { getInstagramPosts } = require("../controllers/eventsController");

// Route to get Instagram posts
router.get("/instagram/:username", getInstagramPosts);

module.exports = router;
