import preval from "babel-plugin-preval/macro";

export type OldBlogPost = {|
  id: string,
  title: string,
  url: string,
  summary: string,
  banner_image?: string,
  "_external-site"?: string,
  date_published: string
|};

export type NewBlogPost = {|
  title: string,
  summary?: string,
  image?: string,
  publishedAt: string,
  published: boolean,
  path: string
|};

export type BlogPost = $Exact<OldBlogPost> | $Exact<NewBlogPost>;

const files = preval`
  module.exports = require('fs').readdirSync('./pages/thoughts').filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
`;

const posts: Array<NewBlogPost> = files
  .map(file => {
    // $FlowIssue
    const { meta } = require(`./pages/thoughts/${file}`);
    if (!meta) throw new Error("Blog posts need to `export const meta = {}`!");
    if (!meta.publishedAt)
      throw new Error(
        "Blog posts need to have a publishedAt date in their metadata."
      );

    return {
      ...meta,
      path: `/thoughts/${file.replace(/\.mdx?$/, "")}`
    };
  })
  .filter(meta => meta.published)
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

module.exports = posts;
