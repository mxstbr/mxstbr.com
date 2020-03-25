import React from "react";
import blogposts from "../data/blog-posts";

type Props = {};

class Rss extends React.Component<Props> {
  // $FlowIssue
  static async getInitialProps({ res }) {
    res.setHeader("Content-Type", "text/xml");
    res.write(`<?xml version="1.0" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Max Stoibers (@mxstbr) Thoughts</title>
      <atom:link href="https://mxstbr.com/rss" rel="self" type="application/rss+xml"/>
      <link>https://mxstbr.com/thoughts</link>
      <description>Candid thoughts about React.js, Node.js, startups and other interesting things.</description>
      <language>en</language>
${blogposts
  .map(
    post => `      <item>
        <title>${post.title}</title>
        <link>https://mxstbr.com${post.path}</link>
        <guid>https://mxstbr.com${post.path}</guid>
        <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        <description><![CDATA[
          <p>${post.summary}
          <a href="https://mxstbr.com${post.path}">&nearr;</a></p>
        ]]></description>
      </item>`
  )
  .join("\n")}
    </channel>
  </rss>
`);
    res.end();
  }
}

export default Rss;
