import puppeteer from "puppeteer";

import { generateFeed, saveFeedToFiles } from "./feeds";
import { getAnnouncements } from "./getAnnouncements";

const HEADLESS = process.env.HEADLESS === "true";
const FEED_ITEMS_NUMBER = 2;
const TWINS_ROOT_URL = "https://twins.tsukuba.ac.jp/campusweb/campusportal.do";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  /**
   * For forwarding logs in the browser to the terminal
   */
  page.on("console", (message) => console.log("page: " + message.text()));

  const announcements = await getAnnouncements({
    page,
    FEED_ITEMS_NUMBER,
    TWINS_ROOT_URL,
  });
  if (!announcements.length) throw new Error("No announcements found");

  await browser.close();

  const feeds = generateFeed(announcements);
  await saveFeedToFiles(feeds);
};

main();
