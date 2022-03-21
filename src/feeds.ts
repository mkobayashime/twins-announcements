import { writeFile, mkdir } from "fs/promises";
import path from "path";

import { Feed } from "feed";

import { Announcement, Feeds } from "./types";

export const generateFeed = (announcements: Announcement[]): Feeds => {
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

export const saveFeedToFiles = async ({ rss2 }: Feeds) => {
  await mkdir(path.resolve("dist"), { recursive: true });
  await writeFile(path.resolve("dist", "twins-announcements.rss"), rss2);
};
