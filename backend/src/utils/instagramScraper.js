const puppeteer = require("puppeteer");
const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

// Define the directory for saving cookies
const COOKIES_DIR = path.join(__dirname, "cookies");

// Ensure cookies directory exists
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR);
}

async function scrapeInstagramPosts(username, credentials) {
  const timestamps = {
    total: { start: performance.now() },
    login: {},
    saveInfoPopup: {},
    notificationsPopup: {},
    profileNavigation: {},
    postProcessing: {},
  };

  // Check if we have a saved session for the user
  const cookiesPath = path.join(COOKIES_DIR, `${credentials.username}.json`);
  const sessionExists = fs.existsSync(cookiesPath);

  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
    );

    // Try to use saved session if it exists
    if (sessionExists) {
      console.log("Using saved session...");

      // Load the saved cookies
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf8"));
      await page.setCookie(...cookies);

      // Go directly to Instagram homepage
      await page.goto("https://www.instagram.com/", {
        waitUntil: "networkidle2",
      });

      // Check if we're actually logged in
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('svg[aria-label="Home"]') !== null;
      });

      if (!isLoggedIn) {
        // Session expired, perform login
        console.log("Session expired, logging in again...");
        await loginToInstagram(page, credentials);

        // Save the new cookies
        const newCookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(newCookies, null, 2));
      }
    } else {
      // No valid session, perform login
      timestamps.login.start = performance.now();
      await loginToInstagram(page, credentials);
      timestamps.login.end = performance.now();

      // Save the cookies for future use
      const cookies = await page.cookies();
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log("Session saved for future use.");
    }

    timestamps.saveInfoPopup.start = performance.now();
    // Check if we need to handle "Save Info" popup
    try {
      const saveInfoButton = await page.$x(
        '//button[contains(text(), "Not Now")]'
      );
      if (saveInfoButton.length > 0) {
        await saveInfoButton[0].click();
        // await page.waitForNavigation({ waitUntil: "networkidle0" });
      }
    } catch (error) {
      console.log('No "Save Info" dialog found, continuing...');
    }
    timestamps.saveInfoPopup.end = performance.now();

    timestamps.notificationsPopup.start = performance.now();
    // Check if we need to handle notifications popup
    try {
      const notNowButton = await page.$x(
        '//button[contains(text(), "Not Now")]'
      );
      if (notNowButton.length > 0) {
        await notNowButton[0].click();
        // await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log("No notifications dialog found, continuing...");
    }
    timestamps.notificationsPopup.end = performance.now();

    timestamps.profileNavigation.start = performance.now();
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    try {
      await page.waitForSelector('a[href*="/p/"]', { timeout: 60000 });
    } catch (error) {
      console.error(`Timeout waiting for posts on ${username}'s profile`);
      throw new Error(`Could not find any posts on ${username}'s profile`);
    }

    timestamps.profileNavigation.end = performance.now();
    console.log("Target Profile");

    const postLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/p/"]');

      // Take the first 5 posts
      return Array.from(links)
        .slice(0, 5)
        .map((link) => link.href);
    });

    console.log("Post Links:", postLinks);

    const posts = [];

    timestamps.postProcessing.start = performance.now();
    // Visit each post and get caption
    for (const link of postLinks) {
      console.log("Processing post:", link);
      await page.goto(link, { waitUntil: "networkidle2" });

      const postData = await page.evaluate(() => {
        const captionElement =
          document.querySelector('div[data-testid="post-comment-root"] span') ||
          document.querySelector("h1") ||
          document.querySelector("article span > div > span");

        const imgElement = document.querySelector(
          'article img[style*="object-fit"]'
        );

        return {
          caption: captionElement
            ? captionElement.textContent
            : "No caption found",
          imageUrl: imgElement ? imgElement.src : null,
          url: window.location.href,
        };
      });

      posts.push(postData);
    }
    timestamps.postProcessing.end = performance.now();

    const durations = {
      total:
        (timestamps.total.end = performance.now()) - timestamps.total.start,
      login: timestamps.login.end - timestamps.login.start || 0,
      saveInfoPopup:
        timestamps.saveInfoPopup.end - timestamps.saveInfoPopup.start,
      notificationsPopup:
        timestamps.notificationsPopup.end - timestamps.notificationsPopup.start,
      profileNavigation:
        timestamps.profileNavigation.end - timestamps.profileNavigation.start,
      postProcessing:
        timestamps.postProcessing.end - timestamps.postProcessing.start,
    };

    console.log("Performance Breakdown (in milliseconds):", durations);

    return { success: true, posts };
  } catch (error) {
    console.error("Instagram scraping error:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to scrape Instagram posts",
    };
  } finally {
    await browser.close();
  }
}

// Function to login to Instagram
async function loginToInstagram(page, credentials) {
  try {
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    await page.waitForSelector('input[name="username"]', { timeout: 60000 });
    await page.type('input[name="username"]', credentials.username);
    await page.type('input[name="password"]', credentials.password);

    await page.click('button[type="submit"]');

    try {
      await Promise.race([
        page.waitForSelector('svg[aria-label="Home"]', { timeout: 60000 }),
        page.waitForSelector('p[role="alert"]', { timeout: 60000 }),
      ]);

      // Check if login was successful or not
      const errorMessage = await page.evaluate(() => {
        const error = document.querySelector('p[role="alert"]');
        return error ? error.textContent : null;
      });

      if (errorMessage) {
        throw new Error(`Instagram login failed: ${errorMessage}`);
      }
    } catch (navigationError) {
      console.log("Navigation detection timed out, continuing anyway...");
      // await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error("Login process error:", error);
    throw error;
  }
}

module.exports = { scrapeInstagramPosts };
