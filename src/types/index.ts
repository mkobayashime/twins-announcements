export type Announcement = Readonly<{
  id: string;
  title: string;
  text: string;
  date: string;
  url: string;
}>;

export type Feeds = Readonly<{
  rss2: string;
}>;
