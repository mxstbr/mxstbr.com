import fetch from "isomorphic-unfetch";
import type { WebMention } from "./types";

const VALID_PROPERTY_TYPES = ["mention-of", "in-reply-to"];
const filterWebMentions = (mentions: Array<WebMention>): Array<WebMention> => {
  return mentions
    .filter(entry => entry.author.name !== "Max Stoiber")
    .filter(entry => VALID_PROPERTY_TYPES.indexOf(entry["wm-property"]) > -1)
    .sort(
      (a, b) =>
        new Date(
          typeof b.published === "string" ? b.published : b["wm-received"]
        ) -
        new Date(
          typeof a.published === "string" ? a.published : a["wm-received"]
        )
    );
};

export const loadWebMentions = async (target: string, page?: number = 0) => {
  return fetch(
    `https://webmention.io/api/mentions.jf2?page=${page}&per-page=20&sort-by=published&target=${target}`
  )
    .then(res => res.json())
    .then(json =>
      Array.isArray(json.children) ? filterWebMentions(json.children) : []
    );
};

export const loadWebMentionCounts = async (target: string) => {
  return fetch(`https://webmention.io/api/count.json?target=${target}`)
    .then(res => res.json())
    .then(res => res.type);
};
