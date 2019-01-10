import React from "react";
import fetch from "isomorphic-unfetch";
import PageHeader from "../../components/PageHeader";
import Paragraph from "../../components/Paragraph";
import Link from "../../components/Link";
import { H3 } from "../../components/Heading";
import BlogPostCard from "../../components/BlogPostCard";
import { ListDivider } from "../../components/Lists";
import blogposts from "../../blog-posts";
import type { OldBlogPost } from "../../blog-posts";

type Props = {
  oldPosts: Array<OldBlogPost>
};

export default class BlogIndex extends React.Component<Props> {
  static async getInitialProps() {
    const data = await fetch("https://mxstbr.blog/feed.json")
      .then(res => res.json())
      .catch(err => {});
    return { oldPosts: data?.items || [] };
  }

  render() {
    return (
      <>
        <PageHeader title="Blog">
          <Paragraph>
            Candid thoughts about React.js, Node.js, startups and other
            interesting things.{" "}
            <Link href="https://buttondown.email/mxstbr">
              Subscribe to the newsletter
            </Link>{" "}
            to be notified when I publish something new.
          </Paragraph>
        </PageHeader>
        {blogposts.map(post => (
          <BlogPostCard key={post.title} post={post} />
        ))}
        <ListDivider>
          <H3 mr={3} mt={2} mb={2}>
            Archive
          </H3>
        </ListDivider>
        {this.props.oldPosts.map(post => (
          <BlogPostCard key={post.title} old={post} />
        ))}
      </>
    );
  }
}
