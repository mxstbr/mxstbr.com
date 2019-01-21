const fs = require("fs");
const path = require("path");
const posts = require("./get-blog-posts");

const OUT_DIR = path.join(process.cwd(), "out");

const feed = {
  version: "https://jsonfeed.org/version/1",
  title: "Max Stoibers (@mxstbr) Thoughts",
  description:
    "Candid thoughts about React.js, Node.js, startups and other interesting things.",
  home_page_url: "https://mxstbr.com/thoughts",
  feed_url: "https://mxstbr.com/feed.json",
  icon: "https://mxstbr.com/static/images/headshot.jpeg",
  favicon: "https://mxstbr.com/static/images/headshot.jpeg",
  author: {
    name: "Max Stoiber (@mxstbr)",
    url: "https://mxstbr.com",
    avatar: "https://mxstbr.com/static/images/headshot.jpeg"
  },
  items: posts.map(post => ({
    id: `https://mxstbr.com${post.path}`,
    url: `https://mxstbr.com${post.path}`,
    title: post.title,
    context_text: `${post.summary} See https://mxstbr.com/thoughts${
      post.path
    }!`,
    summary: post.summary,
    image: post.image,
    date_published: post.publishedAt
  }))
};

module.exports = (dir /*: string */ = OUT_DIR) => {
  fs.writeFileSync(path.join(dir, "feed.json"), JSON.stringify(feed, null, 2));
};
