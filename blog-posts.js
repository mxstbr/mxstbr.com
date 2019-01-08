import preval from "babel-plugin-preval/macro";

const files = preval`
  module.exports = require('fs').readdirSync('./pages/blog').filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
`;

const posts = files
  .map(file => {
    // $FlowIssue
    const { meta } = require(`./pages/blog/${file}`);
    if (!meta) throw new Error("Blog posts need to `export const meta = {}`!");
    if (!meta.publishedAt)
      throw new Error(
        "Blog posts need to have a publishedAt date in their metadata."
      );

    const path = `/blog/${file.replace(/\.mdx?$/, "")}`;
    return {
      ...meta,
      path
    };
  })
  .filter(meta => meta.published)
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

module.exports = posts;
