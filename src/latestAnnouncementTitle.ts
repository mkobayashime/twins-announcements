import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as O from "fp-ts/lib/Option.js";

import type { Announcement } from "./types/index.js";

const filePath = path.resolve("dist", "latestAnnouncementTitle");

export const getLatestAnnouncementTitle = async (): Promise<
	O.Option<string>
> => {
	try {
		if (!existsSync(filePath)) return O.none;

		const titleBuffer = await readFile(filePath);

		return O.some(titleBuffer.toString());
	} catch (err) {
		console.error(err);
		throw new Error(
			"Failed to read title of latest announcement from the file",
		);
	}
};

export const saveLatestAnnouncementTitle = async (
	announcements: Announcement[],
): Promise<void> => {
	const latestAnnouncement = announcements[0];
	if (!latestAnnouncement) {
		throw new Error("No announcements passed to `saveLatestAnnouncementTitle`");
	}

	await mkdir(path.resolve("dist"), { recursive: true });
	await writeFile(filePath, latestAnnouncement.title);
};
