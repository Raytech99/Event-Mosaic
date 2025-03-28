// Check if Instagram credentials are configured on server
// Return credentials if true or false if not
function checkCredentials() {
    const credentials = {
      username: process.env.INSTAGRAM_USERNAME,
      password: process.env.INSTAGRAM_PASSWORD,
    };
  
    if (!credentials.username || !credentials.password) {
      return false;
    }
  
    return credentials;
  }
  
  // Validate request parameters for Instagram scraper
  function validateRequest(req) {
    const { usernames, concurrency, postLimit, timeThreshold } = req.query;
  
    const credentials = checkCredentials();
  
    if (!credentials) {
      return {
        success: false,
        message: "Instagram credentials not configured on server",
      };
    }
  
    if (!usernames) {
      return {
        success: false,
        message: "Instagram usernames are required",
      };
    }
  
    if (
      concurrency &&
      (isNaN(parseInt(concurrency)) ||
        parseInt(concurrency) < 1 ||
        parseInt(concurrency) > 4)
    ) {
      // Check if concurrency is a number and between 1 and 4
      return {
        success: false,
        message: "Invalid concurrency limit",
      };
    }
  
    if (
      postLimit &&
      (isNaN(parseInt(postLimit)) ||
        parseInt(postLimit) < 1 ||
        parseInt(postLimit) > 10)
    ) {
      // Check if post limit is a number and between 1 and 10
      return {
        success: false,
        message: "Invalid post limit",
      };
    }
  
    if (
      timeThreshold &&
      (isNaN(parseInt(timeThreshold)) ||
        parseInt(timeThreshold) < 1 ||
        parseInt(timeThreshold) > 36)
    ) {
      // Check if time threshold is a number and between 1 and 36
      return {
        success: false,
        message: "Invalid time threshold",
      };
    }
  
    return {
      success: true,
      credentials,
    };
  }
  
  module.exports = {
    checkCredentials,
    validateRequest,
  };