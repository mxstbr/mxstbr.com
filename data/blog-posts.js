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
  summary: string,
  image?: string,
  publishedAt: string,
  published: boolean,
  path: string
|};

export type BlogPost = $Exact<OldBlogPost> | $Exact<NewBlogPost>;

const posts: Array<NewBlogPost> = preval`
  module.exports = require('./get-blog-posts.js');
`;

module.exports = posts;
