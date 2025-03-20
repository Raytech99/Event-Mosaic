const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");
const authRoutes = require("./routes/authRoutes"); // Import authentication routes

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Instagram Scraper API" });
});

// Ensure correct route registration
app.use("/api/events", eventsRoutes);
app.use("/api/auth", authRoutes); 

module.exports = app;




