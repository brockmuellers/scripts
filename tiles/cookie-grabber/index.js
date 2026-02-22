// run with node --env-file=.env index.js

// on computer, browser path /usr/bin/google-chrome
// or, can switch back from puppeteer-core to the 
// standard puppeteer package on your computer, 
// which handles downloading and pathing its own 
// private Chromium binary automatically

const { addExtra } = require('puppeteer-extra');
const puppeteer = require('puppeteer-core');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const puppeteerExtra = addExtra(puppeteer);
puppeteerExtra.use(StealthPlugin());

(async () => {
  const browser = await puppeteerExtra.launch({
    // Pull the path directly from the .env file
    executablePath: process.env.BROWSER_PATH, 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://example-target-website.com/login');

  // Pull your credentials directly from the .env file
  await page.type('#username', process.env.TARGET_USERNAME, { delay: 50 });
  await page.type('#password', process.env.TARGET_PASSWORD, { delay: 50 });
  
  console.log("Navigating to login...");
  // Replace with your target URL
  await page.goto('https://example-target-website.com/login', { waitUntil: 'networkidle2' });

  // Add your login logic here (typing credentials, clicking buttons)
  // await page.type('#username', 'my_user', { delay: 50 });
  // await page.type('#password', 'my_pass', { delay: 50 });
  // await page.click('#login-button');
  // await page.waitForNavigation();

  console.log("Extracting cookies...");
  const cookies = await page.cookies();
  
  console.log("Cookies grabbed:", cookies);
  
  // Add your fetch() request here to push the cookies to your Cloudflare Worker/KV

  await browser.close();
})();
