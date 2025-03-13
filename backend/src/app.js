const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");
const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
const { initScheduler } = require("./utils/scheduler");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize scheduler
initScheduler();

// Routes
app.use("/api/events", eventsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

module.exports = app;
