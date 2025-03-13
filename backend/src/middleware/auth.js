const jwt = require("jsonwebtoken");
require("dotenv").config();

// Auth middleware, checks if token is valid, if it is, adds user ID to request object
module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Token is not valid" });
  }
};
