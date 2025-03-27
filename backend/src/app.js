const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");
const authRoutes = require("./routes/authRoutes"); // Import authentication routes

const app = express();

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Event Mosaic API" });
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Ensure correct route registration
app.use("/api/events", eventsRoutes);
app.use("/api/auth", authRoutes); 

module.exports = app;




