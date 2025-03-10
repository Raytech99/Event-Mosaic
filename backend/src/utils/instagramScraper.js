const puppeteer = require("puppeteer");
const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

// Config paths
const COOKIES_DIR = path.join(__dirname, "cookies");

// Ensure cookies directory exists
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR);
}

// Instagram Scraper Class - Handles all Instagram scraping functionality
class InstagramScraper {
  // Create a new Instagram scraper instance
  constructor(credentials) {
    if (!credentials || !credentials.username || !credentials.password) {
      throw new Error("Valid Instagram credentials are required");
    }

    this.credentials = credentials;
    this.cookiesPath = path.join(COOKIES_DIR, `${credentials.username}.json`);
    this.metrics = {
      total: { start: 0, end: 0, duration: 0 },
      login: { start: 0, end: 0, duration: 0 },
      navigation: { start: 0, end: 0, duration: 0 },
      processing: { start: 0, end: 0, duration: 0 },
      postDetails: [],
      recentPostsCount: 0,
    };
  }

  // Helper sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Launch a browser instance
  async launchBrowser() {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
    );

    return { browser, page };
  }

  // Load cookies from storage
  async loadCookies(page) {
    if (!fs.existsSync(this.cookiesPath)) {
      return false;
    }

    try {
      const cookies = JSON.parse(fs.readFileSync(this.cookiesPath, "utf8"));
      await page.setCookie(...cookies);

      // Verify cookies worked by navigating to Instagram
      await page.goto("https://www.instagram.com/", {
        waitUntil: "networkidle2",
      });

      // Check if we're logged in
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('svg[aria-label="Home"]') !== null;
      });

      return isLoggedIn;
    } catch (error) {
      console.error("Error loading cookies:", error.message);
      return false;
    }
  }

  // Save cookies to storage
  async saveCookies(page) {
    try {
      const cookies = await page.cookies();
      fs.writeFileSync(this.cookiesPath, JSON.stringify(cookies, null, 2));
    } catch (error) {
      console.error("Error saving cookies:", error.message);
    }
  }

  // Handle Instagram login
  async login(page) {
    this.metrics.login.start = performance.now();

    try {
      await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "networkidle0",
        timeout: 60000,
      });

      await page.waitForSelector('input[name="username"]', { timeout: 60000 });
      await page.type('input[name="username"]', this.credentials.username);
      await page.type('input[name="password"]', this.credentials.password);

      await Promise.all([
        page.click('button[type="submit"]'),
        page
          .waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 })
          .catch(() => {}),
      ]);

      // Check for login errors
      const errorMessage = await page.evaluate(() => {
        const error = document.querySelector('p[role="alert"]');
        return error ? error.textContent : null;
      });

      if (errorMessage) {
        throw new Error(`Instagram login failed: ${errorMessage}`);
      }

      // Handle popups
      await this.handlePopups(page);

      // Save the new cookies
      await this.saveCookies(page);
    } catch (error) {
      throw new Error(`Login process failed: ${error.message}`);
    } finally {
      this.metrics.login.end = performance.now();
      this.metrics.login.duration =
        this.metrics.login.end - this.metrics.login.start;
    }
  }

  // Handle common Instagram popups
  async handlePopups(page) {
    // Handle "Save Info" popup
    try {
      const saveInfoButton = await page.$x(
        '//button[contains(text(), "Not Now")]'
      );
      if (saveInfoButton.length > 0) {
        await saveInfoButton[0].click();
        await this.sleep(500);
      }
    } catch (error) {
      console.error("Error handling 'Save Info' popup:", error.message);
    }

    // Handle notifications popup
    try {
      const notNowButton = await page.$x(
        '//button[contains(text(), "Not Now")]'
      );
      if (notNowButton.length > 0) {
        await notNowButton[0].click();
        await this.sleep(500);
      }
    } catch (error) {
      console.error("Error handling 'Notifications' popup:", error.message);
    }
  }

  // Get just post URLs from profile page
  async getProfilePostUrls(page, username, postLimit = 10) {
    this.metrics.navigation.start = performance.now();
    this.metrics.processing.start = performance.now();

    try {
      // Navigate to profile page
      await page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      await page.waitForSelector('a[href*="/p/"]', { timeout: 60000 });

      // Extract just the post URLs to process in parallel later
      const postUrls = await page.evaluate((limit) => {
        const links = Array.from(document.querySelectorAll('a[href*="/p/"]'));
        return links.slice(0, limit).map((link) => link.href);
      }, postLimit);

      return postUrls;
    } catch (error) {
      throw new Error(
        `Failed to fetch post URLs from ${username}: ${error.message}`
      );
    } finally {
      this.metrics.navigation.end = performance.now();
      this.metrics.navigation.duration =
        this.metrics.navigation.end - this.metrics.navigation.start;

      this.metrics.processing.end = performance.now();
      this.metrics.processing.duration =
        this.metrics.processing.end - this.metrics.processing.start;
    }
  }

  // Get detailed information about a specific post by visiting its page
  async getPostDetails(page, postUrl) {
    try {
      console.log(`Processing post: ${postUrl}`);

      await page.goto(postUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await this.sleep(2000);

      // Ensure the page has fully rendered by scrolling a bit
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });

      await this.sleep(1000);

      // Extract post data
      const postData = await page.evaluate(() => {
        const cleanText = (text) => {
          if (!text) return "";
          return text.replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
        };

        // Get date
        let date = new Date().toISOString();
        const timeElement = document.querySelector("time[datetime]");
        if (timeElement && timeElement.getAttribute) {
          const dateAttr = timeElement.getAttribute("datetime");
          if (dateAttr) {
            date = dateAttr;
          }
        }

        // Get caption
        let caption = "No caption available";
        const captionElement = document.querySelector("div._a9zr");
        if (captionElement && captionElement.textContent) {
          caption = cleanText(captionElement.textContent);
        }

        // Get image
        let imageUrl = null;
        const imageMetaTag = document.querySelector(
          'meta[property="og:image"]'
        );
        if (imageMetaTag && imageMetaTag.getAttribute("content")) {
          const metaUrl = imageMetaTag.getAttribute("content");
          if (metaUrl && metaUrl.includes("http")) {
            imageUrl = metaUrl;
          }
        }

        if (!imageUrl) {
          const imgElements = document.querySelectorAll("article img");
          if (imgElements.length > 0) {
            const filteredImgs = Array.from(imgElements).filter((img) => {
              if (!img.src) return false;
              if (img.src.includes("profile")) return false;
              return img.width > 100 || img.height > 100;
            });

            if (filteredImgs.length > 0) {
              imageUrl = filteredImgs[0].src;
            }
          }
        }

        return { date, caption, imageUrl };
      });

      // Extract video ID if it's a reel or video post
      if (postUrl.includes("/reel/")) {
        const videoId = postUrl.split("/reel/")[1].split("/")[0];
        postData.videoId = videoId;
      }

      return {
        url: postUrl,
        date: postData.date,
        caption: postData.caption,
        imageUrl: postData.imageUrl,
        videoId: postData.videoId,
      };
    } catch (error) {
      console.error(`Error processing post ${postUrl}: ${error.message}`);
      return {
        url: postUrl,
        date: new Date().toISOString(),
        caption: "Error fetching post details",
        error: error.message,
      };
    }
  }

  // Scrape posts from an Instagram profile
  async scrapeProfile(username, options = {}) {
    this.metrics.total.start = performance.now();

    const postLimit = options.postLimit || 4;
    const timeThreshold = options.timeThreshold || 24;
    const batchSize = options.batchSize || 3;
    const maxPosts = options.maxPosts || 10;

    if (!username) {
      return {
        success: false,
        error: "Invalid input",
        message: "Username is required",
      };
    }

    let browser, page;

    try {
      const browserData = await this.launchBrowser();
      browser = browserData.browser;
      page = browserData.page;

      const isSessionValid = await this.loadCookies(page);

      // Login if needed
      if (!isSessionValid) {
        await this.login(page);
      }

      // Step 1: Get post URLs quickly from the profile page
      const postUrls = await this.getProfilePostUrls(page, username, maxPosts);

      if (postUrls.length === 0) {
        throw new Error(`No posts found for ${username}`);
      }

      // Step 2: Process post URLs in batches
      const processedPosts = [];
      const recentPosts = [];

      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - timeThreshold);
      const thresholdISOString = thresholdDate.toISOString();

      // Create multiple pages for parallel processing
      const numPages = Math.min(batchSize, postUrls.length);
      const pages = await Promise.all(
        Array(numPages)
          .fill()
          .map(async () => {
            const newPage = await browser.newPage();
            await newPage.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
            );
            return newPage;
          })
      );

      let pinnedPostsProcessed = false;
      const pinnedPostCount = 3; // Assuming the first 3 posts could be pinned

      // Process in batches
      for (let i = 0; i < postUrls.length; i += batchSize) {
        this.metrics.processing.start = performance.now();

        // Get current batch
        const batchUrls = postUrls.slice(i, i + batchSize);

        // Process batch in parallel
        const batchPromises = batchUrls.map((url, index) =>
          this.getPostDetails(pages[index % pages.length], url)
        );

        const batchResults = await Promise.all(batchPromises);

        this.metrics.processing.end = performance.now();
        this.metrics.processing.duration +=
          this.metrics.processing.end - this.metrics.processing.start;

        // Add to processed posts
        processedPosts.push(...batchResults);

        let batchHasRecentPosts = false;
        let batchHasNonRecentPosts = false;
        const newRecentPosts = [];

        // Process all posts in batch
        for (let j = 0; j < batchResults.length; j++) {
          const post = batchResults[j];
          try {
            // Direct string comparison when possible
            const isRecent = post.date >= thresholdISOString;

            if (isRecent) {
              newRecentPosts.push(post);
              batchHasRecentPosts = true;
            } else {
              batchHasNonRecentPosts = true;
            }
          } catch (e) {
            console.error(`Error processing date: ${e.message}`);
          }
        }

        // Add to recent posts
        recentPosts.push(...newRecentPosts);

        // Check if we've processed the potentially pinned posts
        const totalProcessedPosts = processedPosts.length;
        if (!pinnedPostsProcessed && totalProcessedPosts >= pinnedPostCount) {
          pinnedPostsProcessed = true;
        }

        // If we're past the pinned posts and found a non-recent post, terminate
        if (pinnedPostsProcessed && batchHasNonRecentPosts) {
          console.log(
            `\nTerminating early: Found a non-recent post after processing pinned content.`
          );
          break;
        }
      }

      // Close additional pages
      for (const p of pages) {
        await p.close();
      }

      // Sort recent posts by date (newest first)
      recentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Track post metrics
      recentPosts.forEach((post) => {
        this.metrics.postDetails.push({
          url: post.url,
          date: post.date,
        });
      });

      this.metrics.recentPostsCount = recentPosts.length;

      this.metrics.total.end = performance.now();
      this.metrics.total.duration =
        this.metrics.total.end - this.metrics.total.start;

      return {
        success: true,
        username,
        posts: recentPosts,
        recentPostsCount: recentPosts.length,
        message: "Successfully scraped recent Instagram posts",
        metrics: {
          total: this.metrics.total.duration,
          login: this.metrics.login.duration,
          navigation: this.metrics.navigation.duration,
          processing: this.metrics.processing.duration,
          postMetrics: this.metrics.postDetails,
        },
      };
    } catch (error) {
      this.metrics.total.end = performance.now();
      this.metrics.total.duration =
        this.metrics.total.end - this.metrics.total.start;

      return {
        success: false,
        username,
        error: error.message,
        message: "Failed to scrape recent Instagram posts",
        metrics: {
          total: this.metrics.total.duration,
          login: this.metrics.login.duration,
          postMetrics: this.metrics.postDetails,
        },
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = { InstagramScraper };
