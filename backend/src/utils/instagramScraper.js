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

      // Try to use existing session
      const isSessionValid = await this.loadCookies(page);

      // Login if needed
      if (!isSessionValid) {
        await this.login(page);
      }

      // Step 1: Get post URLs quickly from the profile page
      console.log(`Fetching up to ${maxPosts} post URLs from ${username}...`);
      const postUrls = await this.getProfilePostUrls(page, username, maxPosts);

      if (postUrls.length === 0) {
        throw new Error(`No posts found for ${username}`);
      }

      console.log(
        `Found ${postUrls.length} posts, processing in batches of ${batchSize}`
      );

      // Step 2: Process post URLs in batches
      const processedPosts = [];
      const recentPosts = [];

      // Calculate threshold date
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - timeThreshold);

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

      // Early termination variables
      let pinnedPostsProcessed = false;
      const pinnedPostCount = 3; // Assuming the first 3 posts could be pinned

      // Process in batches
      for (let i = 0; i < postUrls.length; i += batchSize) {
        this.metrics.processing.start = performance.now();

        // Get current batch
        const batchUrls = postUrls.slice(i, i + batchSize);
        console.log(
          `\nProcessing batch ${Math.floor(i / batchSize) + 1}: ${
            batchUrls.length
          } posts`
        );

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

        // Filter for recent posts
        const newRecentPosts = [];
        let foundNonRecentPostAfterPinned = false;

        for (const post of batchResults) {
          try {
            const postDate = new Date(post.date);
            const isRecent =
              !isNaN(postDate.getTime()) && postDate >= thresholdDate;
            console.log(
              `Post: ${post.url}, Date: ${post.date}, Recent: ${isRecent}`
            );

            if (isRecent) {
              newRecentPosts.push(post);
            } else if (pinnedPostsProcessed) {
              // If we've processed the pinned posts and found a non-recent post, flag it
              foundNonRecentPostAfterPinned = true;
              console.log(
                `Found non-recent post after pinned section, will terminate after this batch.`
              );
              // Don't break here, continue processing the current batch
            }
          } catch (e) {
            console.error(`Error filtering post date: ${post.date}`, e);
          }
        }

        // Add to recent posts
        recentPosts.push(...newRecentPosts);

        console.log(
          `\nFound ${newRecentPosts.length} recent posts in this batch. Total: ${recentPosts.length}`
        );

        // Check if we've processed the potentially pinned posts
        const totalProcessedPosts = processedPosts.length;
        if (!pinnedPostsProcessed && totalProcessedPosts >= pinnedPostCount) {
          pinnedPostsProcessed = true;
          console.log(
            `\nProcessed ${pinnedPostCount} potentially pinned posts, now checking for chronological posts.`
          );
        }

        // If we found a non-recent post after the pinned section, terminate early
        if (foundNonRecentPostAfterPinned) {
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
