import React from "react";
import timeout from "p-timeout";
import { Flex, Box } from "rebass";
import { ExternalLink as LinkExternal, ChevronRight } from "react-feather";
import ConditionalWrap from "conditional-wrap";
import Link from "../components/Link";
import Icon from "../components/Icon";
import { H2 } from "../components/Heading";
import Text from "../components/Text";
import { getGitHubRepoStars } from "../helpers/github-api";
import CardGrid from "../components/CardGrid";
import OSSProject from "../components/OpenSourceProjectCard";
import Card from "../components/Card";
import AppearancesList from "../components/AppearancesList";
import RestrictHeight from "../components/RestrictHeight";
import { TextButton } from "../components/Button";
import appearances from "../appearances";
import formatDate from "../utils/format-date";

const ViewMoreLink = props => (
  <Box mt={3}>
    <TextButton as={Link} href={props.href}>
      <Text fontSize={1}>{props.children}</Text>
    </TextButton>
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
      <Flex
        as="main"
        flexDirection="column"
        alignItems={["center", "flex-start"]}
      >
        <H2 mt={4}>Open Source</H2>
        <CardGrid>
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
              and CSS to style your apps without stress
            </OSSProject.Description>
          </OSSProject>
          <OSSProject
            stars={20009}
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
        </CardGrid>
        <ViewMoreLink href="https://github.com/mxstbr">
          View more on GitHub
          <Icon ml={2} css={{ verticalAlign: "text-bottom" }}>
            <LinkExternal size="1em" />
          </Icon>
        </ViewMoreLink>

        <Flex flexDirection="column" width={[1, 0.75, 0.5]}>
          <H2>Recent Appearances</H2>
          <AppearancesList appearances={appearances.slice(0, 7)} />
        </Flex>
        <ViewMoreLink href="/appearances">
          View all
          <Icon>
            <ChevronRight size="1em" />
          </Icon>
        </ViewMoreLink>

        <H2>Recent Blog Posts</H2>
        <CardGrid>
          {posts.slice(0, 3).map((post, i) => {
            const external = post["_external-site"];
            const date = new Date(post.date_published);
            return (
              <Link
                href={post.url}
                key={post.id}
                width={[1, "calc(50% - 16px)", "calc(33.3% - 16px)"]}
                m={[1, 2]}
              >
                <Card>
                  <Card.Title>{post.title}</Card.Title>
                  <Card.Body css={{ maxHeight: "5em", overflow: "hidden" }}>
                    {post.summary}
                  </Card.Body>
                  <Card.FinePrint>
                    {date.getDate()}.{date.getMonth() + 1}.{date.getFullYear()}
                    {` on `}
                    {!!external ? `the ${external}` : `mxstbr.blog`}
                    {!!external && (
                      <Icon css={{ verticalAlign: "text-bottom" }}>
                        <LinkExternal size="1em" />
                      </Icon>
                    )}
                  </Card.FinePrint>
                </Card>
              </Link>
            );
          })}
        </CardGrid>
        <ViewMoreLink href="https://mxstbr.blog">
          View more on mxstbr.blog
          <Icon>
            <ChevronRight size="1em" />
          </Icon>
        </ViewMoreLink>
      </Flex>
    );
  }
}

export default Homepage;
