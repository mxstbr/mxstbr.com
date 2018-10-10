import React from "react";
import timeout from "p-timeout";
import { Flex, Box, Link } from "rebass";
import Octicon, {
  LinkExternal,
  ChevronRight
} from "@githubprimer/octicons-react";
import ConditionalWrap from "conditional-wrap";
import NextLink from "next/link";
import { H2 } from "../components/Heading";
import Text from "../components/Text";
import { getGitHubRepoStars } from "../helpers/github-api";
import OSSProject from "../components/OpenSourceProjectCard";
import Card from "../components/Card";
import AppearancesList from "../components/AppearancesList";
import RestrictHeight from "../components/RestrictHeight";
import Button from "../components/Button";
import appearances from "../appearances";
import formatDate from "../utils/format-date";

const ViewMoreLink = props => (
  <Box mt={2}>
    <ConditionalWrap
      condition={props.internal}
      wrap={children => <NextLink href={props.href}>{children}</NextLink>}
    >
      <Button
        as="a"
        href={props.href}
        target={props.internal ? undefined : "_blank"}
      >
        <Text fontWeight="bold">{props.children}</Text>
      </Button>
    </ConditionalWrap>
  </Box>
);

class Homepage extends React.Component {
  static async getInitialProps() {
    const data = await fetch("https://mxstbr.blog/feed.json")
      .then(res => res.json())
      .catch(err => {});
    return { posts: data?.items || [] };
  }

  render() {
    const { posts } = this.props;

    return (
      <Box as="main">
        <H2 mt={1}>Open Source</H2>
        <Flex flexWrap="wrap">
          <OSSProject
            light
            stars={4676}
            repo="withspectrum/spectrum"
            bg="linear-gradient(to top right, #7213FB, #4F16EE)"
          >
            <OSSProject.Title>Spectrum</OSSProject.Title>
            <OSSProject.Description>
              Simple, powerful online communities in a unified platform.
            </OSSProject.Description>
          </OSSProject>
          <OSSProject
            stars={19445}
            repo="styled-components/styled-components"
            light
            bg="linear-gradient(to top right, #DB7093, #DAA357)"
          >
            <OSSProject.Title>styled-components</OSSProject.Title>
            <OSSProject.Description>
              Visual primitives for the component age. Use the best bits of ES6
              and CSS to style your apps without stress 💅
            </OSSProject.Description>
          </OSSProject>
          <OSSProject
            stars={19984}
            repo="react-boilerplate/react-boilerplate"
            light
            bg="linear-gradient(to bottom right, #6D6E72, #9EA0A6)"
          >
            <OSSProject.Title>react-boilerplate</OSSProject.Title>
            <OSSProject.Description>
              {" "}
              A foundation for React apps with a focus on scalability, developer
              experience and best practices.
            </OSSProject.Description>
          </OSSProject>
          <OSSProject stars={4168} repo="styled-components/polished">
            <OSSProject.Title>Polished</OSSProject.Title>
            <OSSProject.Description>
              A lightweight toolset for writing styles in JavaScript, "the
              lodash of CSS-in-JS".
            </OSSProject.Description>
          </OSSProject>
          <OSSProject stars={2101} repo="mxstbr/sharingbuttons.io">
            <OSSProject.Title>sharingbuttons.io</OSSProject.Title>
            <OSSProject.Description>
              Super fast and easy social media sharing buttons without tracking
              your users.
            </OSSProject.Description>
          </OSSProject>
          <OSSProject stars={1495} repo="mxstbr/login-flow">
            <OSSProject.Title>Login Flow</OSSProject.Title>
            <OSSProject.Description>
              An example React and Redux implementation of a login/register
              flow.
            </OSSProject.Description>
          </OSSProject>
        </Flex>
        <ViewMoreLink href="https://github.com/mxstbr">
          View more on GitHub
          <Box css={{ display: "inline-block" }} ml={2}>
            <Octicon>
              <LinkExternal />
            </Octicon>
          </Box>
        </ViewMoreLink>
        <H2>Recent Appearances</H2>
        <AppearancesList appearances={appearances.slice(0, 6)} />
        <ViewMoreLink internal href="/appearances" as={NextLink}>
          View all{" "}
          <Octicon>
            <ChevronRight />
          </Octicon>
        </ViewMoreLink>
        <H2>Recent Blog Posts</H2>
        <Flex flexDirection="row" flexWrap="wrap" width={1} mb={3}>
          {posts.slice(0, 3).map((post, i) => {
            const external = post["_external-site"];
            const date = new Date(post.date_published);
            return (
              <Flex key={post.id} width="calc(33.33% - 16px)" mr={3} mb={1}>
                <Link
                  href={post.url}
                  target={!!external ? "_blank" : ""}
                  css={{ textDecoration: "none", color: "inherit" }}
                >
                  <Card>
                    <Card.Title>{post.title}</Card.Title>
                    <Card.Body css={{ maxHeight: "5em", overflow: "hidden" }}>
                      {post.summary}
                    </Card.Body>
                    <Card.FinePrint>
                      {date.getDate()}.{date.getMonth() + 1}.
                      {date.getFullYear()}
                      {` on `}
                      {!!external ? `the ${external}` : `mxstbr.blog`}
                      {!!external && (
                        <Box css={{ display: "inline-block" }} ml={2}>
                          <Octicon>
                            <LinkExternal />
                          </Octicon>
                        </Box>
                      )}
                    </Card.FinePrint>
                  </Card>
                </Link>
              </Flex>
            );
          })}
        </Flex>
        <ViewMoreLink href="https://mxstbr.blog">
          View more on mxstbr.blog
          <Box css={{ display: "inline-block" }} ml={2}>
            <Octicon>
              <LinkExternal />
            </Octicon>
          </Box>
        </ViewMoreLink>
      </Box>
    );
  }
}

export default Homepage;
