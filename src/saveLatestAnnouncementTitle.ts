import { mkdir, writeFile } from "fs/promises";
import path from "path";

import type { Announcement } from "./types/index.js";

export const saveLatestAnnouncementTitle = async (
  announcements: Announcement[],
): Promise<void> => {
  const latestAnnouncement = announcements[0];
  if (!latestAnnouncement) {
    throw new Error("No announcements passed to `saveLatestAnnouncementTitle`");
  }

  await mkdir(path.resolve("dist"), { recursive: true });
  await writeFile(
    path.resolve("dist", "latestAnnouncementTitle"),
    latestAnnouncement.title,
  );
};
