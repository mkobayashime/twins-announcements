import * as O from "fp-ts/lib/Option.js";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

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
