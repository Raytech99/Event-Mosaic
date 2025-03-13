const express = require("express");
const router = express.Router();
const {
  getInstagramPosts,
  getMultipleInstagramPosts,
} = require("../controllers/eventsController");

// Route to get Instagram posts
router.get("/instagram/:username", getInstagramPosts);

// Route to get Instagram posts for multiple accounts in parallel
router.get("/instagram-multiple", getMultipleInstagramPosts);

module.exports = router;
