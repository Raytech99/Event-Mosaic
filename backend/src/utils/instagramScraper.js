const puppeteer = require("puppeteer");
const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");
const { time } = require("console");

// Config paths
const COOKIES_DIR = path.join(__dirname, "cookies");

// Ensure cookies directory exists
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR);
}

// Instagram Scraper Class - Handles all Instagram scraping functionality
class InstagramScraper {
  // Create a new Instagram scraper instance
  // Input: { username: string, password: string }
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
    };
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
    // Check if cookies file exists
    if (!fs.existsSync(this.cookiesPath)) {
      return false;
    }

    try {
      // WARNING: Race condition risk - multiple instances writing to the same cookie file
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

      return isLoggedIn; // Return true if we're logged in
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
        await page.waitForTimeout(1000);
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
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.error("Error handling 'Notifications' popup:", error.message);
    }
  }

  // Get posts directly from profile page
  async getProfilePosts(page, username, postLimit = 5) {
    this.metrics.navigation.start = performance.now();
    this.metrics.processing.start = performance.now();

    try {
      // Navigate to profile page
      await page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      // Wait for posts to load
      await page.waitForSelector('a[href*="/p/"]', { timeout: 60000 });

      // Extract all post data directly from the profile page
      const posts = await page.evaluate((limit) => {
        const results = [];
        // Find all post links
        const postLinks = Array.from(
          document.querySelectorAll('a[href*="/p/"]')
        ).slice(0, limit);

        for (const link of postLinks) {
          try {
            // Find the article or media container for each post
            const article = link.closest("article") || link.parentElement;

            // Find image
            const img = article.querySelector('img[src*="instagram"]');

            // Try to find caption if available 
            const captionSpans = article.querySelectorAll("span");
            let caption = "Caption not available in preview";
            for (const span of captionSpans) {
              if (span.textContent && span.textContent.length > 10) {
                caption = span.textContent;
                break;
              }
            }

            // Find post date
            let date = new Date().toISOString();
            const timeElement = article.querySelector("time");
            if (timeElement && timeElement.getAttribute) {
              const dateAttr = timeElement.getAttribute("datetime");
              if (dateAttr) {
                date = dateAttr;
              }
            }

            results.push({
              caption: caption,
              imageUrl: img ? img.src : null,
              url: link.href,
              date: date,
            });
          } catch (err) {
            // If one post fails, continue with others
            console.error(`Error processing post: ${err}`);
          }
        }

        return results;
      }, postLimit);

      
      if (posts.length === 0) {
        console.log("Failed to get full post data, collecting minimal data");
        // Fallback to just collecting links
        const postLinks = await page.evaluate((limit) => {
          console.log("Collecting minimal post data");
          const links = document.querySelectorAll('a[href*="/p/"]');
          return Array.from(links)
            .slice(0, limit)
            .map((link) => ({
              caption: "Caption not available in preview",
              imageUrl: null,
              url: link.href,
              date: new Date().toISOString(),
            }));
        }, postLimit);

        console.log("Minimal post data collected ", postLinks);
        return postLinks;
      }

      return posts;
    } catch (error) {
      throw new Error(
        `Failed to fetch posts from ${username}: ${error.message}`
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

  // Scrape posts from an Instagram profile
  async scrapeProfile(username, options = {}) {
    this.metrics.total.start = performance.now();

    const postLimit = options.postLimit || 5;
    const timeThreshold = options.timeThreshold || 24;

    if (!username) {
      return {
        success: false,
        error: "Invalid input",
        message: "Username is required",
      };
    }

    let browser, page;

    try {
      // Launch browser
      const browserData = await this.launchBrowser();
      browser = browserData.browser;
      page = browserData.page;

      // Try to use existing session
      const isSessionValid = await this.loadCookies(page);

      // Login if needed
      if (!isSessionValid) {
        await this.login(page);
      }

      // Get all posts data directly from the profile page (optimized method)
      let posts = await this.getProfilePosts(page, username, postLimit);
      // Track post metrics
      posts.forEach((post) => {
        this.metrics.postDetails.push({
          url: post.url,
          duration: this.metrics.processing.duration / posts.length, // Estimate an even split
        });
      });

      this.metrics.total.end = performance.now();
      this.metrics.total.duration =
        this.metrics.total.end - this.metrics.total.start;

      return {
        success: true,
        username,
        posts,
        recentPostsCount: this.metrics.recentPostsCount,
        message: "Successfully scraped Instagram posts",
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
        message: "Failed to scrape Instagram posts",
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
