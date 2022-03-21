import { Feed } from "feed";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
      date,
    });
  });

  return {
    rss2: feedClient.rss2(),
    atom1: feedClient.atom1(),
    json1: feedClient.json1(),
  };
};

export const saveFeedToFiles = async ({ rss2, atom1, json1 }: Feeds) => {
  await mkdir(path.resolve("dist"), { recursive: true });

  await writeFile(path.resolve("dist", "twins-announcements-rss2.xml"), rss2);
  await writeFile(path.resolve("dist", "twins-announcements-atom1.xml"), atom1);
  await writeFile(
    path.resolve("dist", "twins-announcements-json1.json"),
    json1,
  );
};
