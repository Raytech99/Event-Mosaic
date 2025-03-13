const express = require("express");
const router = express.Router();
const {
  getUserAccounts,
  followAccount,
  unfollowAccount,
  getAccountPosts,
  getAllFollowedPosts,
  triggerScrape,
} = require("../controllers/accountController");
const auth = require("../middleware/auth");

// Protect all routes with authentication
router.use(auth);

// Routes for the Instagram Account
router.get("/accounts", getUserAccounts);
router.post("/follow", followAccount);
router.delete("/unfollow/:username", unfollowAccount);
router.get("/posts/:username", getAccountPosts);
router.get("/dashboard", getAllFollowedPosts);

// TODO: Remove this route in production
router.post("/trigger", triggerScrape);

module.exports = router;
