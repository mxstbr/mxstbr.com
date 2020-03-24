import React from "react";
import { Flex, Box, Image } from "rebass";
import styled from "styled-components";
import { withRouter, type Router } from "next/router";
import { parse, format } from "date-fns";
import fetch from "isomorphic-unfetch";
import Button from "./Button";
import Head from "./Head";
import { H3, H2 } from "./Heading";
import Text from "./Text";
import Paragraph from "./Paragraph";
import Link from "./Link";
import Icon from "./Icon";
import Card from "./Card";
import NextPost from "./NextPost";
import ViewMoreLink from "./ViewMoreLink";
import BreadcrumbLink from "./BreadcrumbLink";
import blogposts from "../data/blog-posts";
import WebMentionCounts from "./WebMentions/WebMentionCounts";
import WebMentionResponses from "./WebMentions/WebMentionResponses";
import {
  ChevronLeft,
  Send,
  Heart,
  MessageCircle,
  HelpCircle,
  Twitter
} from "react-feather";
import { NewsletterUpsellCard } from "./NewsletterForm";
import HackerNewsLink from "./HackerNewsLink";
import PrismTheme from "./PrismTheme";
import type { NewBlogPost } from "../data/blog-posts";

type Props = {
  meta: NewBlogPost,
  children: React$Node,
  router: Router
};

const BackToBlog = props => (
  // $FlowIssue
  <BreadcrumbLink {...props} color="primary" href="/thoughts">
    <Icon ml={0} mr={1}>
      <ChevronLeft size="1em" />
    </Icon>
    BACK TO BLOG
  </BreadcrumbLink>
);

const getShareLinks = (path: string, title: string) => ({
  twitter: `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://mxstbr.com${path}/`
  )}`,
  github: `https://github.com/mxstbr/mxstbr.com/edit/master/pages${path}.md`,
  hn: `https://news.ycombinator.com/submitlink?u=https://mxstbr.com${encodeURIComponent(
    path
  )}/&t=${encodeURIComponent(title)}`
});

export default withRouter((props: Props) => {
  const { meta, children, router } = props;
  const published = format(parse(meta.publishedAt), "MMMM Do, YYYY");
  const { twitter, github, hn } = getShareLinks(router.pathname, meta.title);
  const current = blogposts.map(({ title }) => title).indexOf(meta.title);
  const next = blogposts[current - 1];
  const prev = blogposts[current + 1];

  return (
    <>
      <Head
        title={meta.title}
        description={meta.summary}
        image={meta.image}
        jsonld={{
          "@context": "http://schema.org",
          "@type": "BlogPosting",
          headline: meta.title,
          image: meta.image,
          //  "editor": "John Doe",
          //  "genre": "search engine optimization",
          //  "keywords": "seo sales b2b",
          //  "wordcount": "1120",
          //  "publisher": "Book Publisher Inc",
          url: `https://mxstbr.com${router.pathname}/`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": "https://mxstbr.com/blog"
          },
          datePublished: format(parse(meta.publishedAt), "YYYY-MM-DD"),
          dateModified: format(parse(meta.publishedAt), "YYYY-MM-DD"),
          description: meta.summary,
          author: {
            "@type": "Person",
            "@id": "mxstbr",
            name: "Max Stoiber"
          }
        }}
      >
        {meta.published !== true && <meta name="robots" content="noindex" />}
      </Head>
      <PrismTheme />

      <BackToBlog mb={4} mt={[4, 5]} />
      {meta.published !== true && (
        <Text
          mb={3}
          mt={4}
          p={3}
          fontSize={2}
          lineHeight={1.5}
          bg="#FFF7E8"
          css={{
            border: "1px solid #F2AA1F",
            borderRadius: "4px",
            a: {
              textDecoration: "underline"
            }
          }}
        >
          <strong>⚠️ THIS IS A DRAFT, PLEASE DO NOT SHARE ⚠️</strong>{" "}
          <Link
            href={`https://twitter.com/messages/compose?recipient_id=2451223458&text=${encodeURIComponent(
              `I have some feedback about "${meta.title}": `
            )}`}
          >
            DM me on Twitter
          </Link>{" "}
          if you have any feedback.
        </Text>
      )}
      <H2 mb={3} mt={4}>
        {meta.title}
      </H2>
      <Text mt={3} mb={4} color="quaternary">
        {meta.published !== true
          ? "Not yet published "
          : `Published ${published} `}
        <WebMentionCounts />
      </Text>
      {children}
      {meta.published === true && (
        <Paragraph fontSize={1} mt={4} mb={4}>
          <HackerNewsLink path={router.pathname} title={meta.title}>
            {({ href }) => <Link href={href}>Discuss on HackerNews</Link>}
          </HackerNewsLink>
          {" · "}
          <Link href={twitter}>Discuss on Twitter</Link> ·{" "}
          <Link href={github}>Edit on GitHub</Link>
        </Paragraph>
      )}
      <hr />
      <NewsletterUpsellCard />
      {(prev || next) && (
        <Flex
          justifyContent="space-between"
          flexDirection={["column-reverse", "row"]}
          my={5}
        >
          {prev && (
            <NextPost position="left" title={prev.title} href={prev.path} />
          )}
          <Box my={[2, 0]} />
          {next && (
            <NextPost position="right" title={next.title} href={next.path} />
          )}
        </Flex>
      )}
    </>
  );
});
