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
import blogposts from "../blog-posts";
import {
  ChevronLeft,
  Send,
  Heart,
  MessageCircle,
  HelpCircle,
  Twitter
} from "react-feather";
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

type WebMention = {
  author: {
    name: string,
    photo: string,
    url: string
  },
  content?: {
    html: string,
    text: string
  },
  published: ?string,
  url: string,
  "wm-id": number,
  "wm-property":
    | "like-of"
    | "mention-of"
    | "in-reply-to"
    | "bookmark-of"
    | "repost-of",
  "wm-received": string,
  "wm-source": string,
  "wm-target": string
};

const WEB_MENTIONS = "https://webmention.io/api/mentions.jf2";

const ALLOWED_WEB_MENTIONS = ["mention-of", "in-reply-to", "like-of"];
const filterWebMentions = (mentions: Array<WebMention>): Array<WebMention> => {
  return mentions
    .filter(entry => entry.author.name !== "Max Stoiber")
    .sort(
      (a, b) =>
        new Date(
          typeof a.published === "string" ? a.published : b["wm-received"]
        ) -
        new Date(
          typeof b.published === "string" ? b.published : b["wm-received"]
        )
    );
};

type State = {
  mentions: ?Array<WebMention>,
  error: ?string
};

const loadWebMentions = async (target: string, page?: number = 0) => {
  return fetch(`${WEB_MENTIONS}?page=${page}&target=${target}`)
    .then(res => res.json())
    .then(async json => {
      if (!Array.isArray(json.children) || json.children.length === 0)
        return [];

      return [...json.children, ...(await loadWebMentions(target, page + 1))];
    })
    .catch(err => {
      return [];
    });
};

const handleLineBreaks = (text: string) =>
  text
    .replace(/\n+/g, "\n")
    .split("\n")
    .map((item, key) => (
      <>
        {item}
        <br />
      </>
    ));

class BlogPost extends React.Component<Props, State> {
  state = {
    mentions: null,
    error: null
  };

  async componentDidMount() {
    const url = `https://mxstbr.com${this.props.router.pathname}/`;
    try {
      const mentions = await loadWebMentions(url);
      console.log(mentions);
      this.setState({
        mentions: Array.isArray(mentions) ? filterWebMentions(mentions) : []
      });
    } catch (err) {
      this.setState({
        mentions: [],
        error: "WebMentions failed to load"
      });
    }
  }

  render() {
    const { meta, children, router } = this.props;
    const { mentions } = this.state;
    const published = format(parse(meta.publishedAt), "MMMM Do, YYYY");
    const { twitter, github } = getShareLinks(router.pathname);
    const current = blogposts.map(({ title }) => title).indexOf(meta.title);
    const next = blogposts[current - 1];
    const prev = blogposts[current + 1];

    const likes =
      Array.isArray(mentions) &&
      mentions.filter(
        mention =>
          mention["wm-property"] === "like-of" ||
          mention["wm-property"] === "bookmark-of" ||
          mention["wm-property"] === "repost-of"
      );
    const responses =
      Array.isArray(mentions) &&
      mentions.filter(
        mention =>
          mention["wm-property"] === "in-reply-to" ||
          mention["wm-property"] === "mention-of"
      );

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
        <H3>
          Webmentions{" "}
          <Link href="https://indieweb.org/Webmention">
            <Icon title="Webmention is a web standard for mentions and conversations across the web.">
              <HelpCircle color="#999" size="0.75em" />
            </Icon>
          </Link>
        </H3>
        {mentions === null ? (
          <Paragraph>Loading...</Paragraph>
        ) : (
          <>
            <Paragraph as="div" mb={4} color="tertiary">
              <Icon verticalAlign="bottom" ml={0} mr={1}>
                <Heart size="1em" />
              </Icon>{" "}
              {(likes && likes.length) || 0} likes{" "}
              <Icon ml={2} mr={1}>
                <MessageCircle size="1em" />
              </Icon>{" "}
              {(responses && responses.length) || 0} responses
            </Paragraph>
            {responses &&
              responses
                .filter(mention => mention.content && mention.content.text)
                .map(mention => (
                  <Flex flexDirection="row" key={mention["wm-id"]} my={3}>
                    <Link href={mention.url}>
                      <Image
                        width={40}
                        height={40}
                        mr={3}
                        css={{ borderRadius: "50%" }}
                        alt={`avatar of ${mention.author.name}`}
                        src={mention.author.photo}
                      />
                    </Link>
                    <Box>
                      <Link href={mention.url}>
                        <Text fontWeight="bold" mb={1} mr={2}>
                          {mention.author.name}
                          <Box
                            as="span"
                            color="tertiary"
                            css={{ fontWeight: "normal" }}
                          >
                            {" · "}
                            {format(
                              parse(
                                typeof mention.published === "string"
                                  ? mention.published
                                  : mention["wm-received"]
                              ),
                              "DD MMM, YYYY"
                            )}
                          </Box>
                          {mention.url.indexOf("twitter.com") > -1 && (
                            <Box
                              as="span"
                              color="tertiary"
                              css={{ fontWeight: "normal" }}
                            >
                              {" · "}
                              <Icon>
                                <Twitter size="1em" />
                              </Icon>
                            </Box>
                          )}
                        </Text>
                      </Link>
                      {mention.content && (
                        <Paragraph color="tertiary" fontSize={2}>
                          {handleLineBreaks(mention.content.text)}
                        </Paragraph>
                      )}
                    </Box>
                  </Flex>
                ))}
          </>
        )}
      </>
    );
  }
}

export default withRouter(BlogPost);
