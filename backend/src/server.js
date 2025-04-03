const app = require("./app");
const connectDB = require("./db");  // Import database connection
const path = require('path');
const { initScheduler } = require("./utils/scheduler");
require("dotenv").config({ path: path.resolve(__dirname, '../../.env') });

connectDB();  // Connect to MongoDB

initScheduler();  // Initialize the scheduler

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
