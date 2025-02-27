const puppeteer = require("puppeteer");

async function scrapeInstagramPosts(username, credentials) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    // Login first (required by Instagram)
    await page.goto("https://www.instagram.com/accounts/login/");
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', credentials.username);
    await page.type('input[name="password"]', credentials.password);

    // Click login button and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Check if we need to handle "Save Info" popup
    try {
      const saveInfoButton = await page.$x(
        '//button[contains(text(), "Not Now")]'
      );
      if (saveInfoButton.length > 0) {
        await saveInfoButton[0].click();
        await page.waitForNavigation({ waitUntil: "networkidle0" });
      }
    } catch (error) {
      console.log('No "Save Info" dialog found, continuing...');
    }

    // Check if we need to handle notifications popup
    try {
      const notNowButton = await page.$x(
        '//button[contains(text(), "Not Now")]'
      );
      if (notNowButton.length > 0) {
        await notNowButton[0].click();
      }
    } catch (error) {
      console.log("No notifications dialog found, continuing...");
    }

    // Go to target profile
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.waitForSelector('a[href*="/p/"]');

    console.log("Target Profile")

    // Get post links using the specific selector
    const postLinks = await page.evaluate(() => {
      // Try the specific selector first
      const postsContainer = document.querySelector(
        "#mount_0_0_6u > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div:nth-child(2) > div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > div.xg7h5cd.x1n2onr6"
      );

      let links = [];

      if (postsContainer) {
        // If we found the container, look for post links inside it
        links = postsContainer.querySelectorAll('a[href*="/p/"]');
      } else {
        // Fallback to a more general selector if the specific one fails
        links = document.querySelectorAll('a[href*="/p/"]');
      }

      return Array.from(links)
        .slice(0, 5)
        .map((link) => link.href);
    });

    const posts = [];

    // Visit each post and get caption
    for (const link of postLinks) {
      console.log("Page")
      await page.goto(link, { waitUntil: "networkidle2" });

      const postData = await page.evaluate(() => {
        // Try different selectors for caption
        const captionElement =
          document.querySelector('div[data-testid="post-comment-root"] span') ||
          document.querySelector("h1") ||
          document.querySelector("article span > div > span");

        // Try to get image
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

module.exports = { scrapeInstagramPosts };
