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

// Fall back to getting meta from string in case of cyclical dependency
const contents = preval`
  const files = require('fs').readdirSync('./pages/thoughts').filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
  module.exports = files.reduce((map, file) => {
    map[file] = require('fs').readFileSync('./pages/thoughts/' + file, 'utf8')
    return map;
  }, {});
`;
const META = /export\s+const\s+meta\s+=\s+(\{(\n|.)*?\n\})/;

const posts: Array<NewBlogPost> = files
  .map(file => {
    // $FlowIssue
    let { meta } = require(`./pages/thoughts/${file}`);
    // This could be undefined due to a cyclical dep, so we fall back to
    // parsing the file contents
    if (!meta) {
      const match = META.exec(contents[file]);
      if (match && typeof match[1] === "string") {
        // Yeah eval is evil but this is trusted input and, contrary to
        // JSON.parse, also supports JavaScript objects
        meta = eval("(" + match[1] + ")");
      }
    }
    if (!meta) throw new Error(`${file} needs to \`export const meta = {}\``);
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
