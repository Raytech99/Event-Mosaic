const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");
const authRoutes = require("./routes/authRoutes"); // Import authentication routes
const instagramRoutes = require("./routes/instagramRoutes"); // Import Instagram routes
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // List of allowed web origins
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://eventmosaic.net",
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for development
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
app.use("/api/instagram", instagramRoutes);

module.exports = app;
