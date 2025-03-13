const { InstagramScraper } = require("./instagramScraper");

// Scrape multiple Instagram accounts in parallel
async function scrapeMultipleAccounts(usernames, credentials, options = {}) {
  // Set default options
  const {
    concurrencyLimit = 2,
    postLimit = 5,
    timeout = 120000,
    timeThreshold = 12,
  } = options;

  // Validate inputs
  if (!Array.isArray(usernames) || usernames.length === 0) {
    throw new Error("At least one username is required");
  }

  if (!credentials || !credentials.username || !credentials.password) {
    throw new Error("Valid Instagram credentials are required");
  }

  console.log(
    `Starting parallel scraping for ${usernames.length} accounts with concurrency limit of ${concurrencyLimit}`
  );
  console.log(`Filtering for posts within the last ${timeThreshold} hours`);

  // Process usernames in batches to control concurrency
  const results = [];
  for (let i = 0; i < usernames.length; i += concurrencyLimit) {
    const batch = usernames.slice(i, i + concurrencyLimit);
    const batchNumber = Math.floor(i / concurrencyLimit) + 1;
    const totalBatches = Math.ceil(usernames.length / concurrencyLimit);

    console.log(
      `Processing batch ${batchNumber}/${totalBatches}: ${batch.join(", ")}`
    );

    // Create scraper instances for each username in batch
    const batchPromises = batch.map((username) => {
      // Create individual timeout for each scraper
      const scrapePromise = async () => {
        try {
          const scraper = new InstagramScraper(credentials);
          const result = await scraper.scrapeProfile(username, {
            postLimit,
            timeThreshold,
          });
          return result;
        } catch (error) {
          return {
            username,
            success: false,
            error: error.message || "Unknown error",
            posts: [],
          };
        }
      };

      // Add timeout protection
      return Promise.race([
        scrapePromise(),
        new Promise((_, reject) => {
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            reject(
              new Error(`Timeout scraping ${username} after ${timeout}ms`)
            );
          }, timeout);
        }),
      ]).catch((error) => {
        return {
          username,
          success: false,
          error: error.message || "Unknown error",
          posts: [],
        };
      });
    });

    // Wait for all promises in the current batch to resolve
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    console.log(`Completed batch ${batchNumber}/${totalBatches}`);
  }

  // Count posts within timeframe
  const totalRecentPosts = results.reduce(
    (sum, result) => sum + (result.posts ? result.posts.length : 0),
    0
  );

  console.log(
    `Found ${totalRecentPosts} posts within the last ${timeThreshold} hours`
  );

  // Summarize results
  const successCount = results.filter((r) => r.success).length;
  console.log(`Success: ${successCount}/${usernames.length} accounts`);

  // Format response
  const response = {
    success: successCount > 0,
    total: usernames.length,
    successCount,
    totalRecentPosts,
    data: results,
  };

  return response;
}

module.exports = { scrapeMultipleAccounts };
