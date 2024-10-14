import * as O from "fp-ts/lib/Option.js";
import playwright from "playwright";

import { generateFeed, saveFeedToFiles } from "./feeds.js";
import { getAnnouncements } from "./getAnnouncements.js";
import { saveLatestAnnouncementTitle } from "./latestAnnouncementTitle.js";

const HEADLESS = process.env.HEADLESS === "true";
const FORCE_FULL_FETCH = process.env.FORCE_FULL_FETCH === "true";
const NANABLE_FEED_ITEMS_NUMBER = Number.parseInt(
  process.env.FEED_ITEMS_NUMBER ?? "",
);
const FEED_ITEMS_NUMBER = Number.isNaN(NANABLE_FEED_ITEMS_NUMBER)
  ? 20
  : NANABLE_FEED_ITEMS_NUMBER;
const TWINS_ROOT_URL = "https://twins.tsukuba.ac.jp/campusweb/campusportal.do";

(async () => {
  const timeout = global.setTimeout(
    () => {
      throw new Error("Root timeout");
    },
    10 * 60 * 1000,
  );

  const browser = await playwright.chromium.launch({
    headless: HEADLESS,
  });
  const page = await browser.newPage({ viewport: null });

  /**
   * For forwarding logs in the browser to the terminal
   */
  page.on("console", (message) => console.log(`page: ${message.text()}`));

  const announcements = await getAnnouncements({
    page,
    FORCE_FULL_FETCH,
    FEED_ITEMS_NUMBER,
    TWINS_ROOT_URL,
  });

  await browser.close();

  if (O.isSome(announcements)) {
    if (!announcements.value.length) throw new Error("No announcements found");

    const feeds = generateFeed(announcements.value);
    await saveFeedToFiles(feeds);

    await saveLatestAnnouncementTitle(announcements.value);
  }

  global.clearTimeout(timeout);
})().catch((err) => console.log(err));
