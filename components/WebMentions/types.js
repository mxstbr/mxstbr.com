export type WebMention = {
  author: {
    name: string,
    photo: string,
    url: string
  },
  content?: {
    html: string,
    text: string
  },
  published: ?string,
  url: string,
  "wm-id": number,
  "wm-property":
    | "like-of"
    | "mention-of"
    | "in-reply-to"
    | "bookmark-of"
    | "repost-of",
  "wm-received": string,
  "wm-source": string,
  "wm-target": string
};

export type WebMentionCounts = {
  like: number,
  mention: number,
  reply: number,
  repost: number
};
