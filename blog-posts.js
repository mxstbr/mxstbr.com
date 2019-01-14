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

// Load all posts meta data
const posts: Array<NewBlogPost> = preval`
  const fs = require('fs')
  const META = /export\\s+const\\s+meta\\s+=\\s+(\\{(\\n|.)*?\\n\\})/;
  const files = fs.readdirSync('./pages/thoughts')
    .filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

  module.exports = files
    .map(file => {
      const contents = fs.readFileSync('./pages/thoughts/' + file, 'utf8')
      const match = META.exec(contents);
      if (!match || typeof match[1] !== 'string') throw new Error(\`\${file} needs to export const meta = {}\`);

      const meta = eval('(' + match[1] + ')')

      return {
        ...meta,
        path: '/thoughts/' + file.replace(/\\.mdx?$/, '')
      };
    })
    .filter(meta => meta.published)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
`;

module.exports = posts;
