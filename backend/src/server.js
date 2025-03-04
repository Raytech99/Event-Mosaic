const app = require("./app");
const connectDB = require("./db");  // Import database connection
require("dotenv").config();

connectDB();  // Connect to MongoDB

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
