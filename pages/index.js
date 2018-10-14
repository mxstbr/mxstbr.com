import React from "react";
import timeout from "p-timeout";
import { Flex, Box } from "rebass";
import { ExternalLink as LinkExternal, ChevronRight } from "react-feather";
import ConditionalWrap from "conditional-wrap";
import { parse, format } from "date-fns";
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

import appearances from "../appearances";
import projects from "../open-source-projects";

const ViewMoreLink = props => (
  <Box mt={4}>
    <TextButton as={Link} href={props.href}>
      <Text fontSize={2}>{props.children}</Text>
    </TextButton>
  </Box>
);

type BlogPost = {
  id: string,
  title: string,
  url: string,
  summary: string,
  banner_image?: string,
  "_external-site"?: string,
  date_published: string
};

type Props = {
  posts: Array<BlogPost>
};

class Homepage extends React.Component<Props> {
  static async getInitialProps() {
    const data = await fetch("https://mxstbr.blog/feed.json")
      .then(res => res.json())
      .catch(err => {});
    return { posts: data?.items || [] };
  }

  render() {
    const { posts } = this.props;

    return (
      <Main>
        <PageHeader title="Hey, I'm Max! 👋">
          <Paragraph centered>
            I'm a JavaScript Engineer from Austria 🇦🇹 and I love React and Node.
            I'm the technical co-founder of{" "}
            <Link href="https://spectrum.chat">Spectrum</Link>, where we're
            making it easier to start, grow and nurture large online
            communities.
          </Paragraph>
          <Paragraph centered>
            If I'm not coding or{" "}
            <Link href="https://twitter.com/mxstbr">tweeting</Link>, I'm likely
            brewing coffee on my espresso machine (I'm a huge{" "}
            <Link href="https://github.com/mxstbr/ama/issues/46">
              specialty coffee geek
            </Link>
            ), exploring the world or skiing. My drug of choice? Fresh, white
            powder. 🤙
          </Paragraph>
        </PageHeader>
        <H2 mt={3}>Featured Open Source Projects</H2>
        <WideSection>
          <CardGrid>
            {projects.filter(project => project.featured).map(project => (
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
            {posts.slice(0, 3).map((post, i) => {
              const external = post["_external-site"];
              const date = parse(post.date_published);
              return (
                <Link
                  href={post.url}
                  key={post.id}
                  width={[1, "calc(50% - 16px)", "calc(33.3% - 16px)"]}
                  m={[1, 2]}
                  mb={2}
                >
                  <Card>
                    <Card.Title>{post.title}</Card.Title>
                    <Card.Body css={{ maxHeight: "5em", overflow: "hidden" }}>
                      {post.summary}
                    </Card.Body>
                    <Card.FinePrint>
                      {format(date, "Do MMM")}
                      {` on `}
                      {external != undefined
                        ? `the ${external}`
                        : `mxstbr.blog`}
                      {external != undefined && (
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
        </WideSection>
        <ViewMoreLink href="https://mxstbr.blog">
          View more on mxstbr.blog
          <Icon>
            <ChevronRight size="1em" />
          </Icon>
        </ViewMoreLink>
      </Main>
    );
  }
}

export default Homepage;
