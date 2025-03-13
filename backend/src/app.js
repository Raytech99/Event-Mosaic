const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");
const authRoutes = require("./routes/authRoutes"); // Import authentication routes

const app = express();

app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Instagram Scraper API" });
});

// Ensure correct route registration
app.use("/api/events", eventsRoutes);
app.use("/api/auth", authRoutes); 

module.exports = app;




