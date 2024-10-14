import { parse } from "date-fns";
import * as O from "fp-ts/lib/Option.js";
import md5 from "md5";
import type { Page } from "puppeteer";

import { getLatestAnnouncementTitle } from "./latestAnnouncementTitle.js";
import type { Announcement } from "./types/index.js";

const getAnnouncementBody = async (
  page: Page,
): Promise<Pick<Announcement, "text" | "url">> => {
  const targetIFrame = await page.$("iframe#main-frame-if");
  if (!targetIFrame) {
    throw new Error("Target iframe not found");
  }

  const { text, url }: Pick<Announcement, "text" | "url"> =
    await targetIFrame.evaluate((iframe) => {
      if (!(iframe instanceof HTMLIFrameElement)) {
        throw new Error(
          "targetIFrame doesn't have element of HTMLIFrameElement",
        );
      }

      const iFrameSrc = iframe.getAttribute("src");
      if (!iFrameSrc) throw new Error("iFrameSrc not found");

      const documentRoot = iframe.contentDocument;

      const text =
        documentRoot?.querySelector<HTMLDivElement>(
          "#webpage-contents",
        )?.innerText;
      if (!text) throw new Error("Announcement text not found");

      return {
        text: text.length < 200 ? text : `${text.slice(0, 200)}…`,
        url: `https://twins.tsukuba.ac.jp/campusweb/${iFrameSrc}`,
      };
    });

  return {
    text,
    url,
  };
};

export const getAnnouncements = async ({
  page,
  FORCE_FULL_FETCH,
  FEED_ITEMS_NUMBER,
  TWINS_ROOT_URL,
}: {
  page: Page;
  FORCE_FULL_FETCH: boolean;
  FEED_ITEMS_NUMBER: number;
  TWINS_ROOT_URL: string;
}): Promise<O.Option<Announcement[]>> => {
  const announcements: Announcement[] = [];

  const waitForAnnouncementToBeLoaded = async ({ page }: { page: Page }) => {
    const spinner = await page.$("#main-frame-if-loading");
    if (!spinner) throw Error("Spinner element not found.");

    for (let timeSpent = 0; timeSpent < 30000; timeSpent += 200) {
      const displayValue = await page.evaluate((spinner) => {
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

  const latestAnnouncementTitle = await getLatestAnnouncementTitle();

  try {
    for (const [index, announcementItem] of recentAnnouncementItems.entries()) {
      const { title, date } = await page.evaluate((trElement) => {
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
        const date = dateMatch?.length ? dateMatch[0] : undefined;
        if (!date) throw new Error("Date not found");

        return {
          title,
          date,
        };
      }, announcementItem);

      if (
        !FORCE_FULL_FETCH &&
        index === 0 &&
        O.isSome(latestAnnouncementTitle) &&
        latestAnnouncementTitle.value === title
      ) {
        console.log("Full fetch skipped");
        return O.none;
      }

      /**
       * Published time is not shown in TWINS, so assume it's noon JST
       */
      const parsedDate = parse(`${date} 12:00`, "y/M/d H:mm", new Date());

      const anchorElement = await announcementItem.$("a");
      if (!anchorElement) {
        throw new Error("Anchor element for an announcement not found");
      }

      await anchorElement?.click();

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await waitForAnnouncementToBeLoaded({ page });

      console.log("Found announcement:", title);

      announcements.push({
        id: md5(title),
        title,
        date: parsedDate,
        ...(await getAnnouncementBody(page)),
      });
    }

    return O.some(announcements);
  } catch (err) {
    console.error(err);
    return O.some([]);
  }
};
