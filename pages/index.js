import React from "react";
import timeout from "p-timeout";
import { Flex, Box } from "rebass";
import { ExternalLink as LinkExternal, ChevronRight } from "react-feather";
import ConditionalWrap from "conditional-wrap";
import { parse, format } from "date-fns";
import styled from "styled-components";
import fetch from "isomorphic-unfetch";
import blogposts from "../data/blog-posts";
import Link from "../components/Link";
import Icon from "../components/Icon";
import { H2 } from "../components/Heading";
import Text from "../components/Text";
import Paragraph from "../components/Paragraph";
import CardGrid from "../components/CardGrid";
import OSSProject from "../components/OpenSourceProjectCard";
import Card from "../components/Card";
import AppearancesList from "../components/AppearancesList";
import { TextButton } from "../components/Button";
import Image from "../components/Image";
import Main from "../components/Main";
import PageHeader from "../components/PageHeader";
import WideSection from "../components/WideSection";
import BlogPostCard from "../components/BlogPostCard";
import Head from "../components/Head";
import ViewMoreLink from "../components/ViewMoreLink";
import { DEFAULT_TITLE } from "./_app";
import type { OldBlogPost } from "../data/blog-posts";

import appearances from "../data/appearances";
import projects from "../data/open-source-projects";

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
            I'm a JavaScript Engineer from Austria 🇦🇹 in love with React and
            Node. I currently work on open source JavaScript tooling at{" "}
            <Link href="https://gatsbyjs.com">Gatsby</Link>. Before that I
            worked at <Link href="https://github.com">GitHub</Link>, who
            acquired my startup{" "}
            <Link href="https://spectrum.chat">Spectrum</Link>.
          </Paragraph>
          <Paragraph centered>
            If I'm not coding or{" "}
            <Link href="https://twitter.com/mxstbr">tweeting</Link>, I'm likely
            brewing coffee on my espresso machine (I'm a huge{" "}
            <Link href="https://github.com/mxstbr/ama/issues/46">
              specialty coffee geek
            </Link>
            ), exploring the world or skiing. My drug of choice? Fresh, white
            powder snow. 🤙
          </Paragraph>
        </PageHeader>
        {/* Render default title */}
        <Head title={DEFAULT_TITLE} />
        <H2 mt={3}>Featured Open Source Projects</H2>
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
            <ChevronRight size="1em" />
          </Icon>
        </ViewMoreLink>

        <Flex flexDirection="column" width={1}>
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
        <WideSection>
          <CardGrid>
            {blogposts.slice(0, 3).map((post, i) => (
              <BlogPostCard key={post.title} post={post} />
            ))}
          </CardGrid>
        </WideSection>
        <ViewMoreLink href="/thoughts">
          View more
          <Icon>
            <ChevronRight size="1em" />
          </Icon>
        </ViewMoreLink>
      </Main>
    );
  }
}

export default Homepage;
