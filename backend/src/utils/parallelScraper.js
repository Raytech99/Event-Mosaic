const { InstagramScraper } = require("./instagramScraper");
const { performance } = require("perf_hooks");

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

  // Performance metrics
  const metrics = {
    total: {
      start: performance.now(),
      end: 0,
      duration: 0,
    },
    batches: [],
  };
  
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

    // Start batch metrics
    const batchMetric = {
      number: batchNumber,
      accounts: batch,
      start: performance.now(),
      end: 0,
      duration: 0,
      results: [],
    };

    console.log(
      `Processing batch ${batchNumber}/${totalBatches}: ${batch.join(", ")}`
    );

    // Create scraper instances for each username in batch
    const batchPromises = batch.map((username) => {
      // Create individual timeout for each scraper
      const scrapePromise = async () => {
        const accountMetric = {
          username,
          start: performance.now(),
          end: 0,
          duration: 0,
        };

        try {
          const scraper = new InstagramScraper(credentials);
          const result = await scraper.scrapeProfile(username, {
            postLimit,
            timeThreshold,
          });

          accountMetric.end = performance.now();
          accountMetric.duration = accountMetric.end - accountMetric.start;
          accountMetric.success = result.success;
          accountMetric.recentPostsCount = result.recentPostsCount || 0;

          // Add detailed metrics to batch results
          batchMetric.results.push(accountMetric);

          return result;
        } catch (error) {
          accountMetric.end = performance.now();
          accountMetric.duration = accountMetric.end - accountMetric.start;
          accountMetric.success = false;
          accountMetric.error = error.message;

          // Add error metrics to batch results
          batchMetric.results.push(accountMetric);

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
        const accountMetric = {
          username,
          start: performance.now() - timeout, 
          end: performance.now(),
          duration: timeout,
          success: false,
          error: error.message,
        };

        // Add timeout metrics to batch results
        batchMetric.results.push(accountMetric);

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

    // Complete batch metrics
    batchMetric.end = performance.now();
    batchMetric.duration = batchMetric.end - batchMetric.start;
    metrics.batches.push(batchMetric);

    console.log(
      `Completed batch ${batchNumber}/${totalBatches} in ${batchMetric.duration.toFixed(
        0
      )}ms`
    );

    // Optional: Add delay between batches to reduce rate limiting
    // if (i + concurrencyLimit < usernames.length) {
    //   await new Promise((resolve) => setTimeout(resolve, 2000));
    // }
  }

  // Calculate and log total execution time
  metrics.total.end = performance.now();
  metrics.total.duration = metrics.total.end - metrics.total.start;

  // Count posts within timeframe
  const totalRecentPosts = results.reduce(
    (sum, result) => sum + (result.posts ? result.posts.length : 0),
    0
  );

  console.log(
    `Completed scraping ${
      usernames.length
    } accounts in ${metrics.total.duration.toFixed(0)}ms`
  );
  console.log(
    `Found ${totalRecentPosts} posts within the last ${timeThreshold} hours`
  );

  // Summarize results
  const successCount = results.filter((r) => r.success).length;
  console.log(`Success: ${successCount}/${usernames.length} accounts`);

  // Batch performance breakdown
  console.log("Batch performance:");
  metrics.batches.forEach((batch) => {
    console.log(
      `- Batch ${batch.number}: ${batch.duration.toFixed(0)}ms for ${
        batch.accounts.length
      } accounts`
    );
    batch.results.forEach((account) => {
      console.log(
        `  - ${account.username}: ${
          account.success ? "Success" : "Failed"
        } in ${account.duration.toFixed(0)}ms, Recent posts: ${
          account.recentPostsCount || 0
        }`
      );
    });
  });

  return {
    results,
    totalRecentPosts,
    timeThreshold,
    performance: {
      total: metrics.total.duration,
      batches: metrics.batches.map((batch) => ({
        number: batch.number,
        accounts: batch.accounts,
        duration: batch.duration,
        accountMetrics: batch.results.map((account) => ({
          username: account.username,
          success: account.success,
          duration: account.duration,
          recentPostsCount: account.recentPostsCount || 0,
          error: account.error,
        })),
      })),
    },
  };
}

module.exports = { scrapeMultipleAccounts };
