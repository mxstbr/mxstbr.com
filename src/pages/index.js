import React from "react";
import { Flex, Box } from "rebass";
import { ExternalLink as LinkExternal, ChevronRight } from "react-feather";
import ConditionalWrap from "conditional-wrap";
import { parse, format } from "date-fns";
import styled from "styled-components";
import fetch from "isomorphic-unfetch";
import blogposts from "../../data/blog-posts";
import Link from "../../components/Link";
import Icon from "../../components/Icon";
import { H2 } from "../../components/Heading";
import Text from "../../components/Text";
import Paragraph from "../../components/Paragraph";
import CardGrid from "../../components/CardGrid";
import OSSProject from "../../components/OpenSourceProjectCard";
import Card from "../../components/Card";
import AppearancesList from "../../components/AppearancesList";
import { TextButton } from "../../components/Button";
import Image from "../../components/Image";
import Main from "../../components/Main";
import PageHeader from "../../components/PageHeader";
import WideSection from "../../components/WideSection";
import BlogPostCard from "../../components/BlogPostCard";
import Head from "../../components/Head";
import ViewMoreLink from "../../components/ViewMoreLink";
import { BlogPostListItem } from "../../components/BlogPostListItem";
import { DEFAULT_TITLE } from "../App";
import type { OldBlogPost } from "../../data/blog-posts";

import appearances from "../../data/appearances";
import projects from "../../data/open-source-projects";

type Props = {
  oldPosts: Array<OldBlogPost>
};

class Homepage extends React.Component<Props> {
  static async getInitialProps() {
    const data = await fetch("https://mxstbr.blog/feed.json")
      .then(res => res.json())
      .catch(err => {});
    return { oldPosts: data?.items || [] };
  }

  render() {
    return (
      <Main>
        <PageHeader title="Hey, I'm Max! 👋">
          <Paragraph centered>
            I'm the co-founder of{" "}
            <Link href="https://stellate.co" target="_blank">
              Stellate
            </Link>
            , the GraphQL CDN formerly known as GraphCDN. About
            1% of all public, crawlable websites use open
            source tooling I invented, styled-components.
            <Link
              href="https://twitter.com/mxstbr/status/1336727600996167686?s=20"
              target="_blank"
            >
              <sup style={{ verticalAlign: "super", fontSize: "0.75em" }}>
                1
              </sup>
            </Link>
          </Paragraph>

          <Paragraph centered>
            I also make <Link href="https://bedrock.mxstbr.com">Bedrock</Link>,
            the premium full-stack SaaS boilerplate, and{" "}
            <Link href="/investing">angel invest</Link> in early-stage startups{" "}
            that I'm passionate about.
          </Paragraph>

          <Paragraph centered>
            Previously, I worked on JavaScript tooling at{" "}
            <Link href="https://gatsbyjs.com">Gatsby</Link> and architected a
            greenfield React app at{" "}
            <Link href="https://github.com">GitHub</Link> after they acquired my
            startup <Link href="https://spectrum.chat">Spectrum</Link>, the
            community platform of the future.
          </Paragraph>

          <Paragraph centered>
            If I'm not coding or{" "}
            <Link href="https://twitter.com/mxstbr">tweeting</Link>, I'm likely
            brewing coffee on my espresso machine (I'm a huge{" "}
            <Link href="https://github.com/mxstbr/ama/issues/46">
              specialty coffee geek
            </Link>
            ), climbing in a bouldering gym or skiing around the alps.
          </Paragraph>
        </PageHeader>
        {/* Render default title */}
        <Head title={DEFAULT_TITLE} />
        <H2 mt={3}>My Open Source Projects</H2>
        <WideSection>
          <CardGrid>
            {projects
              .filter(project => project.featured)
              .map(project => (
                <OSSProject
                  key={project.repo}
                  light={!!project.background}
                  repo={project.repo}
                  bg={project.background}
                  stars={project.stars}
                >
                  <OSSProject.Title>{project.name}</OSSProject.Title>
                  <OSSProject.Description>
                    {project.description}
                  </OSSProject.Description>
                </OSSProject>
              ))}
          </CardGrid>
        </WideSection>
        <ViewMoreLink href="/oss">
          View all
          <Icon>
            <ChevronRight strokeWidth="3" size="1em" />
          </Icon>
        </ViewMoreLink>

        <H2 mb={2}>Recent Blog Posts</H2>
        {blogposts.slice(0, 4).map((post, index) => (
          <BlogPostListItem
            key={post.title}
            small={false}
            last={index === 3}
            post={post}
            webmentions
          />
        ))}
        <ViewMoreLink mt={2} href="/thoughts">
          View all
          <Icon>
            <ChevronRight strokeWidth="3" size="1em" />
          </Icon>
        </ViewMoreLink>

        <Flex flexDirection="column" width={1}>
          <H2>Recent Appearances</H2>
          <AppearancesList appearances={appearances.slice(0, 7)} />
        </Flex>
        <ViewMoreLink href="/appearances">
          View all
          <Icon>
            <ChevronRight strokeWidth="3" size="1em" />
          </Icon>
        </ViewMoreLink>
      </Main>
    );
  }
}

export default Homepage;
