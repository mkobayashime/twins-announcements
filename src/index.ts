import { writeFile, mkdir } from "fs/promises";
import path from "path";

import puppeteer, { ElementHandle } from "puppeteer";
import { Feed } from "feed";

const FEED_ITEMS_NUMBER = 2;
const TWINS_ROOT_URL = "https://twins.tsukuba.ac.jp/campusweb/campusportal.do";

type Announcement = Readonly<{
  id: string;
  title: string;
  text: string;
  date: string;
  url: string;
}>;

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
  }): Promise<boolean> => {
    const spinner = await page.$$("#main-frame-if-loading");
    if (!spinner) throw Error("Spinner element not found.");

    for (let timeSpent = 0; timeSpent < 30000; timeSpent += 200) {
      const displayValue = await page.evaluate((spinner: HTMLElement) => {
        const { display } = window.getComputedStyle(spinner);
        console.log(display);
        return display;
      }, ...spinner);
      if (displayValue === "none") {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return false;
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

  for (const announcementItem of recentAnnouncementItems) {
    const anchorElement = await announcementItem.$("a");
    await anchorElement?.click();
    await page.waitForTimeout(1000);

    const loadingTimeout = await waitForAnnouncementToBeLoaded({ page });
    if (!loadingTimeout) return [];

    const announcement = await getAnnouncementBody({ page });
    if (announcement) {
      announcements.push(announcement);
    }
  }

  return announcements;
};

const getAnnouncementBody = async ({
  page,
}: {
  page: puppeteer.Page;
}): Promise<Announcement | undefined> => {
  const targetIFrame: ElementHandle<HTMLIFrameElement> | null = await page.$(
    "iframe#main-frame-if",
  );
  if (!targetIFrame) {
    console.error("target iframe not found");
    return;
  }

  const announcement: Announcement | undefined = await targetIFrame.evaluate(
    async (iframe: HTMLIFrameElement) => {
      async function hashString(string: string) {
        const msgUint8 = new TextEncoder().encode(string);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return hashHex;
      }

      const iFrameSrc = iframe.getAttribute("src");

      const documentRoot = iframe.contentDocument;
      const titleWithDate = documentRoot?.querySelector<HTMLDivElement>(
        "#webpage-list-title-inner",
      )?.innerText;
      const text =
        documentRoot?.querySelector<HTMLDivElement>(
          "#webpage-contents",
        )?.innerText;

      const title = titleWithDate?.replace(/\s+\d{4}\/\d{1,2}\/\d{1,2}$/, "");
      const dateMatch = titleWithDate?.match(
        /^.*\s+(\d{4}\/\d{1,2}\/\d{1,2})$/,
      );
      const date = dateMatch && dateMatch.length > 1 ? dateMatch[1] : undefined;

      if (!titleWithDate || !title || !text || !date || !iFrameSrc) {
        console.error("absent field found", {
          titleWithDate,
          title,
          text,
          date,
          iFrameSrc,
        });
        return;
      }

      return {
        id: await hashString(titleWithDate),
        title,
        text,
        date,
        url: "https://twins.tsukuba.ac.jp/campusweb/" + iFrameSrc,
      };
    },
  );

  return announcement;
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
  await mkdir(path.resolve("dist"));
  await writeFile(path.resolve("dist", "twins-announcements.rss"), rss2);
};

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  const announcements = await getAnnouncements({ page });
  const feeds = generateFeed(announcements);
  await saveFeedToFiles(feeds);

  await browser.close();
};

main();
