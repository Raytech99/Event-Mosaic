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

module.exports = router;
