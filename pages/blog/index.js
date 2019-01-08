import React from "react";
import PageHeader from "../../components/PageHeader";
import posts from "../../blog-posts";

export default () => (
  <>
    <PageHeader title="Blog" />
    <>
      <div>
        {posts.map(post => (
          <p>{post.title}</p>
        ))}
      </div>
    </>
  </>
);
