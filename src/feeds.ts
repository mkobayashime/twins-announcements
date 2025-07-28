import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Feed } from "feed";

import type { Announcement } from "./types/index.js";

const feedFormats = ["rss2", "atom1", "json1"] as const;
type FeedFormat = (typeof feedFormats)[number];

export const generateFeed = (
	announcements: Announcement[],
): Record<FeedFormat, string> => {
	const feedClient = new Feed({
		title: "在学生へのお知らせ | 筑波大学",
		description:
			"TWINSのトップページに掲載される「在学生へのお知らせ」を定期的に取得し、RSSなどの各種フィードとして提供しています. ご連絡は https://github.com/mkobayashime/twins-announcements までお願いします.",
		id: "https://github.com/mkobayashime/twins-announcements",
		link: "https://github.com/mkobayashime/twins-announcements",
		copyright: "",
		language: "ja",
	});

	for (const { id, title, text, date, url } of announcements) {
		feedClient.addItem({
			id,
			title,
			description: text,
			link: url,
			date,
		});
	}

	return {
		rss2: feedClient.rss2(),
		atom1: feedClient.atom1(),
		json1: feedClient.json1(),
	};
};

export const saveFeedToFiles = async ({
	rss2,
	atom1,
	json1,
}: Record<FeedFormat, string>) => {
	await mkdir(path.resolve("dist"), { recursive: true });

	await writeFile(path.resolve("dist", "twins-announcements-rss2.xml"), rss2);
	await writeFile(path.resolve("dist", "twins-announcements-atom1.xml"), atom1);
	await writeFile(
		path.resolve("dist", "twins-announcements-json1.json"),
		json1,
	);
};
