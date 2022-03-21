export type Announcement = Readonly<{
  id: string;
  title: string;
  text: string;
  date: Date;
  url: string;
}>;

export type Feeds = Readonly<{
  rss2: string;
  atom1: string;
  json1: string;
}>;
