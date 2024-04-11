import React from "react";
import { css } from "styled-components";
import fetch from "isomorphic-unfetch";
import { parse, format } from "date-fns";
import { Heading, Box } from "rebass";
import { useStaticQuery, graphql } from "gatsby";
import PageHeader from "../../../components/PageHeader";
import Paragraph from "../../../components/Paragraph";
import Link from "../../../components/Link";
import Text from "../../../components/Text";
import { H3, H4 } from "../../../components/Heading";
import BlogPostCard from "../../../components/BlogPostCard";
import { NewsletterUpsellCard } from "../../../components/NewsletterForm";
import { ListDivider } from "../../../components/Lists";
import blogposts from "../../../data/blog-posts";
import WebMentionsCount from "../../../components/WebMentions/WebMentionCounts";
import { BlogPostListItem } from "./../../../components/BlogPostListItem";
import type { OldBlogPost } from "../../../data/blog-posts";

export default () => {
  const data = useStaticQuery(graphql`
    {
      allOldBlogPost {
        nodes {
          id
          publishedAt
          title
          external
          path
        }
      }
    }
  `);
  const oldPosts = data.allOldBlogPost.nodes;

  console.log(blogposts);

  return (
    <>
      <PageHeader
        title="Blog"
        description="Candid thoughts about React.js, Node.js, startups and other interesting things."
        jsonld={{
          "@context": "http://schema.org",
          "@type": "Blog",
          about:
            "Candid thoughts about React.js, Node.js, startups and other interesting things.",
          author: {
            "@type": "Person",
            "@id": "mxstbr",
            name: "Max Stoiber"
          }
        }}
      >
        <Paragraph>
          Candid thoughts about React.js, Node.js, startups and other
          interesting things.{" "}
          <Link href="#newsletter">Subscribe to the newsletter</Link> to be
          notified when I publish something new.
        </Paragraph>
      </PageHeader>
      {blogposts.map((post, index) => (
        <BlogPostListItem
          key={post.title}
          small={false}
          last={index === blogposts.length - 1}
          post={post}
          webmentions
        />
      ))}
      <NewsletterUpsellCard id="newsletter" my={undefined} mt={4} mb={5} />
      <hr />
      <H3 fontSize={3} mt={5} mb={2}>
        Archive
      </H3>
      <Paragraph color="#666" mb={4}>
        In 2019 I rebuilt my blog. Below are links to my favorite posts from the
        previous iteration. (they are all preserved on{" "}
        <Link href="https://mxstbr.blog">mxstbr.blog</Link>)
      </Paragraph>
      {oldPosts.slice(2, 16).map((post, index) => (
        <BlogPostListItem
          small
          key={post.id}
          post={post}
          webmentions={false}
          last={index === 15}
        />
      ))}
    </>
  );
};
