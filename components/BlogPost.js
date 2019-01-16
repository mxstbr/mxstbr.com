import React from "react";
import { Flex, Box } from "rebass";
import styled from "styled-components";
import { withRouter, type Router } from "next/router";
import { parse, format } from "date-fns";
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
import blogposts from "../blog-posts";
import { ChevronLeft, Send } from "react-feather";
import { NewsletterUpsellCard } from "./NewsletterForm";
import type { NewBlogPost } from "../blog-posts";

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

const getShareLinks = path => ({
  twitter: `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://mxstbr.com${path}`
  )}`,
  github: `https://github.com/mxstbr/mxstbr.com/edit/master/pages${path}.md`
});

export default withRouter(({ router, meta, children }: Props) => {
  const published = format(parse(meta.publishedAt), "MMMM Do, YYYY");
  const { twitter, github } = getShareLinks(router.pathname);
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
          url: `https://mxstbr.com${router.pathname}`,
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
      />

      <BackToBlog mb={4} mt={[4, 5]} />
      <H2 mb={3} mt={4}>
        {meta.title}
      </H2>
      <Text mt={3} mb={4} color="quaternary">
        Published {published}
      </Text>
      {children}
      <Paragraph fontSize={1} mt={4} mb={4}>
        <Link href={twitter}>Discuss on Twitter</Link> ·{" "}
        <Link href={github}>Edit on GitHub</Link>
      </Paragraph>
      <hr />
      <NewsletterUpsellCard />
      <Flex
        justifyContent="space-between"
        flexDirection={["column-reverse", "row"]}
      >
        {prev && (
          <NextPost position="left" title={prev.title} href={prev.path} />
        )}
        <Box my={[2, 0]} />
        {next && (
          <NextPost position="right" title={next.title} href={next.path} />
        )}
      </Flex>
    </>
  );
});
