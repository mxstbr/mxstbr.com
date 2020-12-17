import React from "react";
import { css } from "styled-components";
import fetch from "isomorphic-unfetch";
import { parse, format } from "date-fns";
import { Heading, Box } from "rebass";
import { useStaticQuery, graphql } from "gatsby";
import PageHeader from "./PageHeader";
import Paragraph from "./Paragraph";
import Link from "./Link";
import Text from "./Text";
import { H3, H4 } from "./Heading";
import BlogPostCard from "./BlogPostCard";
import { NewsletterUpsellCard } from "./NewsletterForm";
import { ListDivider } from "./Lists";
import blogposts from "../data/blog-posts";
import WebMentionsCount from "./WebMentions/WebMentionCounts";
import type { OldBlogPost } from "../data/blog-posts";

export const BlogPostListItem = ({ post, small, last, webmentions }) => (
  <Link
    href={post.path}
    mt={small ? 3 : 4}
    pb={small ? 3 : 4}
    css={css`
      width: 100%;
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
      m={0}
      css={{
        height: "1em"
      }}
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
