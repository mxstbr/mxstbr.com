import React from "react";
import { css } from "styled-components";
import fetch from "isomorphic-unfetch";
import { parse, format } from "date-fns";
import { Heading, Box } from "rebass";
import PageHeader from "../../components/PageHeader";
import Paragraph from "../../components/Paragraph";
import Link from "../../components/Link";
import Text from "../../components/Text";
import { H3, H4 } from "../../components/Heading";
import BlogPostCard from "../../components/BlogPostCard";
import { NewsletterUpsellCard } from "../../components/NewsletterForm";
import { ListDivider } from "../../components/Lists";
import blogposts from "../../data/blog-posts";
import WebMentionsCount from "../../components/WebMentions/WebMentionCounts";
import type { OldBlogPost } from "../../data/blog-posts";

type Props = {
  oldPosts: Array<OldBlogPost>
};

const BlogPostListItem = ({ post, small, last, webmentions }) => (
  <Link
    href={post.path}
    mt={small ? 3 : 4}
    pb={small ? 3 : 4}
    css={css`
      display: block;
      ${!last && "border-bottom: 2px solid rgba(0, 0, 0, 0.1);"} &:hover {
        text-decoration: none;
        ${Heading} {
          text-decoration: underline;
        }
      }
    `}
  >
    <H3 mt={0} fontSize={small ? 2 : 4} mb={2}>
      {post.title}
    </H3>
    <Text
      color="quaternary"
      as="div"
      css={{ height: "1em" }}
      fontSize={small ? 1 : 2}
    >
      {format(parse(post.publishedAt), "MMMM Do, YYYY")}
      {typeof post.external === "string" && ` · ${post.external}`}
      {webmentions === true && (
        <>
          <Box as="span" ml={3} />
          <WebMentionsCount path={post.path} size="small" />
        </>
      )}
    </Text>
  </Link>
);

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
          In 2019 I rebuilt my blog. Below are links to my favorite posts from
          the previous iteration. (they are all preserved on{" "}
          <Link href="https://mxstbr.blog">mxstbr.blog</Link>)
        </Paragraph>
        {this.props.oldPosts.slice(0, 16).map((post, index) => (
          <BlogPostListItem
            small
            key={post.title}
            post={{
              title: post.title,
              publishedAt: post.date_published,
              path: post.url,
              external: post["_external-site"]
            }}
            webmentions={false}
            last={index === 15}
          />
        ))}
      </>
    );
  }
}
