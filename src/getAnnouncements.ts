import { parse } from "date-fns";
import md5 from "md5";
import puppeteer, { ElementHandle } from "puppeteer";

import type { Announcement } from "./types";

const getAnnouncementBody = async ({
  page,
  title,
  date,
}: {
  page: puppeteer.Page;
  title: string;
  date: Date;
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

export const getAnnouncements = async ({
  page,
  FEED_ITEMS_NUMBER,
  TWINS_ROOT_URL,
}: {
  page: puppeteer.Page;
  FEED_ITEMS_NUMBER: number;
  TWINS_ROOT_URL: string;
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

      /**
       * Published time is not shown in TWINS, so assume it's noon JST
       */
      const parsedDate = parse(`${date} 12:00`, "y/M/d H:mm", new Date());

      const anchorElement = await announcementItem.$("a");
      await anchorElement?.click();
      await page.waitForTimeout(1000);
      await waitForAnnouncementToBeLoaded({ page });

      announcements.push(
        await getAnnouncementBody({ page, title, date: parsedDate }),
      );
    }

    return announcements;
  } catch (err) {
    console.error(err);
    return [];
  }
};
