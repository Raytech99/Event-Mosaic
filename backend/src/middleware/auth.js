const jwt = require("jsonwebtoken");
require("dotenv").config();

// Auth middleware, checks if token is valid
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if no token
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user ID to request object
    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Token is not valid" });
  }
};
