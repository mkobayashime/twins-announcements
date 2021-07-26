import puppeteer from "puppeteer";

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

  await page.goto(TWINS_ROOT_URL);

  const announcementItems = await page.$$("#keiji-portlet tr");
  const recentAnnouncementItems = announcementItems.slice(0, FEED_ITEMS_NUMBER);

  for (const announcementItem of recentAnnouncementItems) {
    const anchorElement = await announcementItem.$("a");
    await anchorElement?.click();
    await page.waitForTimeout(1000);
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
  const targetIFrame = await page.$("iframe#main-frame-if");
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

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const announcements = await getAnnouncements({ page });
  console.log(announcements);

  await browser.close();
};

main();
