import { writeFile, mkdir } from "fs/promises";
import path from "path";

import puppeteer, { ElementHandle } from "puppeteer";
import md5 from "md5";
import { Feed } from "feed";

import type { Announcement } from "./types";

const HEADLESS = process.env.HEADLESS === "true";
const FEED_ITEMS_NUMBER = 2;
const TWINS_ROOT_URL = "https://twins.tsukuba.ac.jp/campusweb/campusportal.do";

const getAnnouncements = async ({
  page,
}: {
  page: puppeteer.Page;
}): Promise<Announcement[]> => {
  const announcements: Announcement[] = [];

  const waitForAnnouncementToBeLoaded = async ({
    page,
  }: {
    page: puppeteer.Page;
  }) => {
    const spinner = await page.$("#main-frame-if-loading");
    if (!spinner) throw Error("Spinner element not found.");

    for (let timeSpent = 0; timeSpent < 30000; timeSpent += 200) {
      const displayValue = await page.evaluate((spinner: HTMLElement) => {
        const { display } = window.getComputedStyle(spinner);
        return display;
      }, spinner);
      if (displayValue === "none") {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    throw new Error("Loading announcement timeout");
  };

  await page.goto(TWINS_ROOT_URL);

  /**
   * For testing slow network
   */
  // const devToolsClient = await page.target().createCDPSession();
  // await devToolsClient.send("Network.emulateNetworkConditions", {
  //   offline: false,
  //   latency: 2000,
  //   downloadThroughput: (1000 * 1024) / 8,
  //   // downloadThroughput: (376 * 1024) / 8,
  //   uploadThroughput: (200 * 1024) / 8,
  // });
  // await page.setCacheEnabled(false);

  const announcementItems = await page.$$("#keiji-portlet tr");
  const recentAnnouncementItems = announcementItems.slice(0, FEED_ITEMS_NUMBER);

  try {
    for (const announcementItem of recentAnnouncementItems) {
      const { title, date } = await page.evaluate((trElement: HTMLElement) => {
        const title = trElement.querySelector("a")?.innerText;
        if (!title) throw new Error("Title not found");

        /**
         * Remove the title part to avoid matching date-like string included in the title
         */
        const innerHTMLWithoutTitle = trElement.innerHTML.replace(
          /<a.*<\/a>/s,
          "",
        );

        const dateMatch = innerHTMLWithoutTitle?.match(
          /\d{4}\/\d{1,2}\/\d{1,2}/,
        );
        const date = dateMatch && dateMatch.length ? dateMatch[0] : undefined;
        if (!date) throw new Error("Date not found");

        return {
          title,
          date,
        };
      }, announcementItem);

      const anchorElement = await announcementItem.$("a");
      await anchorElement?.click();
      await page.waitForTimeout(1000);
      await waitForAnnouncementToBeLoaded({ page });

      announcements.push(await getAnnouncementBody({ page, title, date }));
    }

    return announcements;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const getAnnouncementBody = async ({
  page,
  title,
  date,
}: {
  page: puppeteer.Page;
  title: string;
  date: string;
}): Promise<Announcement> => {
  const targetIFrame: ElementHandle<HTMLIFrameElement> | null = await page.$(
    "iframe#main-frame-if",
  );
  if (!targetIFrame) {
    throw new Error("Target iframe not found");
  }

  const { text, url }: Pick<Announcement, "text" | "url"> =
    await targetIFrame.evaluate(async (iframe: HTMLIFrameElement) => {
      const iFrameSrc = iframe.getAttribute("src");
      if (!iFrameSrc) throw new Error("iFrameSrc not found");

      const documentRoot = iframe.contentDocument;

      const text =
        documentRoot?.querySelector<HTMLDivElement>(
          "#webpage-contents",
        )?.innerText;
      if (!text) throw new Error("Announcement text not found");

      return {
        text,
        url: "https://twins.tsukuba.ac.jp/campusweb/" + iFrameSrc,
      };
    });

  return {
    id: md5(title),
    title,
    text,
    date,
    url,
  };
};

const generateFeed = (
  announcements: Announcement[],
): {
  rss2: string;
} => {
  const feedClient = new Feed({
    title: "在学生へのお知らせ | 筑波大学",
    id: "https://github.com/mkobayashime/twins-announcements",
    link: "https://github.com/mkobayashime/twins-announcements",
    copyright: "",
    language: "ja",
  });

  announcements.forEach(({ id, title, text, date, url }) => {
    feedClient.addItem({
      id,
      title,
      description: text,
      link: url,
      // date,
      date: new Date(),
    });
  });

  return {
    rss2: feedClient.rss2(),
  };
};

const saveFeedToFiles = async ({ rss2 }: { rss2: string }) => {
  await mkdir(path.resolve("dist"), { recursive: true });
  await writeFile(path.resolve("dist", "twins-announcements.rss"), rss2);
};

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

  const announcements = await getAnnouncements({ page });
  if (!announcements.length) throw new Error("No announcements found");

  const feeds = generateFeed(announcements);
  await saveFeedToFiles(feeds);

  await browser.close();
};

main();
