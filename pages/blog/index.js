import React from "react";
import PageHeader from "../../components/PageHeader";

const preval = require("babel-plugin-preval/macro");
const posts = preval`module.exports = require('../../blog-posts.js')`;

export default () => (
  <>
    <PageHeader title="Blog" />
    <>
      {posts.map(post => (
        <p>{post.title}</p>
      ))}
    </>
  </>
);
