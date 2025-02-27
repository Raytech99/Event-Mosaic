const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");

// Create Express app
const app = express();

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Instagram Scraper API" });
});

// Use Events routes
app.use("/api/events", eventsRoutes);

// Export the app
module.exports = app;
