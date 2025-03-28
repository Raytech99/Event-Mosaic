const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Config paths
const COOKIES_DIR = path.join(__dirname, "cookies");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

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
    await page.setUserAgent(USER_AGENT);

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

  // Check account status (private, not found, no posts)
  async checkAccountStatus(page, username) {
    try {
      const status = await page.evaluate(() => {
        // Check for private account
        const allHeadings = Array.from(document.querySelectorAll("h2"));
        const privateHeading = allHeadings.find(
          (h) =>
            h.textContent && h.textContent.includes("This Account is Private")
        );
        if (privateHeading) return "private";

        // Check for "Sorry, this page isn't available" message (account doesn't exist)
        const notFoundHeading = allHeadings.find(
          (h) => h.textContent && h.textContent.includes("Sorry, this page")
        );
        if (notFoundHeading) return "not_found";

        // Check for no posts
        const allSpans = Array.from(document.querySelectorAll("span"));
        const emptyFeedSpan = allSpans.find(
          (span) =>
            span.textContent && span.textContent.includes("No Posts Yet")
        );
        if (emptyFeedSpan) return "no_posts";

        return "accessible";
      });

      return status;
    } catch (error) {
      console.error(`Error checking account status: ${error.message}`);
      return "unknown";
    }
  }

  // Get just post URLs from profile page
  async getProfilePostUrls(page, username, postLimit = 10) {
    try {
      await page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });

      await this.sleep(1500);

      // Check account status
      const accountStatus = await this.checkAccountStatus(page, username);

      // Handle different account statuses
      switch (accountStatus) {
        case "private":
          throw new Error(`Account ${username} is private`);
        case "not_found":
          throw new Error(`Account ${username} was not found`);
        case "no_posts":
          return []; // Return empty array for no posts
        case "unknown":
          throw new Error(`Unable to determine status of account ${username}`);
      }

      // Try to find post URLs with a more flexible approach
      return await page.evaluate((limit) => {
        let links = Array.from(document.querySelectorAll('a[href*="/p/"]'));

        if (links.length === 0) {
          links = Array.from(document.querySelectorAll("a")).filter((link) => {
            const href = link.getAttribute("href");
            return href && (href.includes("/p/") || href.includes("/reel/"));
          });
        }

        return links.slice(0, limit).map((link) => link.href);
      }, postLimit);
    } catch (error) {
      throw new Error(
        `Failed to fetch post URLs from ${username}: ${error.message}`
      );
    }
  }

  // Get detailed information about a specific post by visiting its page
  async getPostDetails(page, postUrl) {
    try {
      await page.goto(postUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await this.sleep(1000);

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
          // Fallback to image in post content
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

  // Create multiple browser pages for parallel processing
  async createParallelPages(browser, count) {
    return Promise.all(
      Array(count)
        .fill()
        .map(async () => {
          const newPage = await browser.newPage();
          await newPage.setUserAgent(USER_AGENT);
          return newPage;
        })
    );
  }

  // Process posts and filter by time threshold
  async processPostBatches(pages, postUrls, timeThreshold, batchSize) {
    const processedPosts = [];
    const recentPosts = [];

    // Calculate time threshold date
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - timeThreshold);
    const thresholdISOString = thresholdDate.toISOString();

    let pinnedPostsProcessed = false;
    const pinnedPostCount = 3; // Assuming the first 3 posts could be pinned

    // Process in batches
    for (let i = 0; i < postUrls.length; i += batchSize) {
      // Get current batch
      const batchUrls = postUrls.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batchUrls.map((url, index) =>
        this.getPostDetails(pages[index % pages.length], url)
      );

      // Wait for all promises to resolve, then process
      const batchResults = await Promise.all(batchPromises);
      processedPosts.push(...batchResults);

      let batchHasNonRecentPosts = false;
      const newRecentPosts = [];

      // Process all posts in batch
      for (const post of batchResults) {
        try {
          const isRecent = post.date >= thresholdISOString;
          if (isRecent) {
            newRecentPosts.push(post);
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
        break;
      }
    }

    // Sort recent posts by date (newest first)
    return recentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Scrape posts from an Instagram profile
  async scrapeProfile(username, options = {}) {
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

      // Handle case with no posts
      if (postUrls.length === 0) {
        return {
          success: true,
          username,
          posts: [],
          recentPostsCount: 0,
          message: `No posts found for ${username} within the time threshold`,
        };
      }

      // Step 2: Create multiple pages for parallel processing
      const numPages = Math.min(batchSize, postUrls.length);
      const pages = await this.createParallelPages(browser, numPages);

      // Step 3: Process post URLs in batches and get recent posts
      const recentPosts = await this.processPostBatches(
        pages,
        postUrls,
        timeThreshold,
        batchSize
      );

      // Close additional pages
      for (const p of pages) {
        await p.close();
      }

      return {
        success: true,
        username,
        posts: recentPosts,
        recentPostsCount: recentPosts.length,
        message: "Successfully scraped recent Instagram posts",
      };
    } catch (error) {
      let errorMessage = error.message;

      if (error.message.includes("private")) {
        errorMessage = `Account '${username}' is private and cannot be accessed`;
      } else if (error.message.includes("not found")) {
        errorMessage = `Account '${username}' does not exist or has changed its username`;
      } else if (error.message.includes("no posts")) {
        errorMessage = `Account '${username}' does not have any posts`;
      } else if (error.message.includes("timeout")) {
        errorMessage = `Timed out while accessing '${username}' - Instagram may be rate limiting requests`;
      }

      return {
        success: false,
        username,
        error: errorMessage,
        message: "Failed to scrape recent Instagram posts",
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = { InstagramScraper };
