import React from "react";
import PageHeader from "../../components/PageHeader";
import Paragraph from "../../components/Paragraph";
import Link from "../../components/Link";
import posts from "../../blog-posts";

export default () => (
  <>
    <PageHeader title="Blog">
      <Paragraph>
        Essays on JavaScript with a particular focus on React and anything else
        that interests me. (for older writing visit{" "}
        <Link href="https://mxstbr.blog">mxstbr.blog</Link>)
      </Paragraph>
    </PageHeader>
    <div>
      {posts.map(post => (
        <Link href={post.path}>
          <p>{post.title}</p>
        </Link>
      ))}
    </div>
  </>
);
