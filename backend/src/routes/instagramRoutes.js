const express = require("express");
const router = express.Router();
const {
  getMultipleInstagramPosts,
} = require("../controllers/instagramController");
const auth = require("../middleware/auth");

// Protect all routes with authentication
router.use(auth);



/**
 * @swagger
 * /api/instagram/instagram-multiple:
 *   get:
 *     summary: Get Instagram posts for multiple accounts in parallel
 *     tags: [Instagram]
 *     parameters:
 *       - in: query
 *         name: usernames
 *         schema:
 *           type: string
 *         required: true
 *         description: Comma-separated list of Instagram usernames to fetch
 *       - in: query
 *         name: concurrency
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           default: 3
 *         description: Number of parallel requests to make
 *       - in: query
 *         name: postLimit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 10
 *         description: Maximum number of posts to fetch per account
 *       - in: query
 *         name: timeThreshold
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 36
 *           default: 24
 *         description: Maximum age of posts in hours
 *     responses:
 *       200:
 *         description: Successfully fetched Instagram posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 successCount:
 *                   type: integer
 *                 timeThreshold:
 *                   type: integer
 *                 timeframe:
 *                   type: string
 *                 totalRecentPosts:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       username:
 *                         type: string
 *                       posts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             date:
 *                               type: string
 *                             caption:
 *                               type: string
 *                             imageUrl:
 *                               type: string
 *                             videoId:
 *                               type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */

// Route to get Instagram posts for multiple accounts in parallel
router.get("/instagram-multiple", getMultipleInstagramPosts);

module.exports = router;
