import React from "react";
import PageHeader from "../../components/PageHeader";
import Paragraph from "../../components/Paragraph";
import Link from "../../components/Link";
import CardGrid from "../../components/CardGrid";
import BlogPostCard from "../../components/BlogPostCard";
import blogposts from "../../blog-posts";
import WideSection from "../../components/WideSection";
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
    const posts = [...blogposts, ...this.props.oldPosts];
    return (
      <>
        <PageHeader title="Blog">
          <Paragraph>
            Thoughts about JavaScript, React, Node, Startups and anything else
            that interests me.{" "}
            <Link href="https://buttondown.email/mxstbr">
              Subscribe to the newsletter
            </Link>{" "}
            to be notified when I publish something new.
          </Paragraph>
        </PageHeader>
        <WideSection>
          <CardGrid>
            {posts.map(post => (
              <BlogPostCard key={post.title} post={post} />
            ))}
          </CardGrid>
        </WideSection>
      </>
    );
  }
}
