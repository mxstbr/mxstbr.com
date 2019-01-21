import React from "react";
import styled from "styled-components";
import { Flex } from "rebass";
import { Star } from "react-feather";
import Icon from "../components/Icon";
import Text from "../components/Text";
import Paragraph from "../components/Paragraph";
import Link from "../components/Link";
import Head from "../components/Head";
import Heading, { H2, H3 } from "../components/Heading";
import Main from "../components/Main";
import PageHeader from "../components/PageHeader";
import Table from "../components/Table";
import MobileOnly from "../components/MobileOnly";
import DesktopOnly from "../components/DesktopOnly";
import WideSection from "../components/WideSection";

import projects from "../data/open-source-projects";

const StarIcon = props => (
  <Icon css={{ verticalAlign: "text-bottom" }} ml={1}>
    <Star size="1em" />
  </Icon>
);

const OpenSourceProjectTableRow = ({ project }) => (
  <>
    <Flex
      mb={[2, 0]}
      width={[1, "260px"]}
      alignItems={["flex-start", "center"]}
      justifyContent={["space-between", "initial"]}
      height={1}
    >
      <Heading as="h4" fontSize={[3, 2]} alignSelf={["flex-start", "center"]}>
        {project.name}
      </Heading>
      <MobileOnly>
        <Text as="div" color="#666" mt="6px" fontSize={1} ml="1em">
          {project.stars.toLocaleString()}
          <StarIcon />
        </Text>
      </MobileOnly>
    </Flex>
    <Flex
      alignItems={["flex-start", "center"]}
      width={1}
      px={[0, 3]}
      mb={[2, 0]}
    >
      <Text color="#666">{project.description}</Text>
    </Flex>
    <Flex
      alignItems="center"
      justifyContent={["flex-start", "flex-end"]}
      width={[1, "6em"]}
    >
      <DesktopOnly>
        <Text as="div" color="#666" fontSize={1}>
          {project.stars.toLocaleString()}
          <StarIcon />
        </Text>
      </DesktopOnly>
    </Flex>
  </>
);

export default () => (
  <Main>
    <Head
      title="My Open Source Projects - Max Stoiber (@mxstbr)"
      description="A list of most of the open source projects I've (co-) created and/or maintained."
    />
    <PageHeader title="My Open Source Projects">
      <Paragraph centered>
        These are all the open source projects I've (co-) created and am
        actively maintaining or using. (see{" "}
        <Link href="https://github.com/mxstbr">my GitHub profile</Link> for all
        contributions)
      </Paragraph>
    </PageHeader>
    <WideSection>
      <Table
        rows={projects
          .filter(p => p.active !== false)
          .sort((a, b) => b.stars - a.stars || b.name.localeCompare(a.name))
          .map(p => ({
            ...p,
            id: p.repo,
            href: `https://github.com/${p.repo}`
          }))}
        keyField="repo"
        render={row => <OpenSourceProjectTableRow project={row} />}
      />
    </WideSection>
    <Text as="div" color="#666" mt={4} fontSize={2}>
      Total:{" "}
      {projects
        .filter(p => p.active !== false)
        .reduce((total, { stars }) => total + stars, 0)}
      <StarIcon />
    </Text>
    <H2 my={null} mt={4} mb={3} fontSize={3}>
      Past Open Source Projects
    </H2>
    <Paragraph mb={3}>
      I used to work on these projects, but am either no longer involved with
      them or they are archived.
    </Paragraph>
    <WideSection>
      <Table
        rows={projects
          .filter(p => p.active === false)
          .sort((a, b) => b.stars - a.stars || b.name.localeCompare(a.name))
          .map(p => ({
            ...p,
            id: p.repo,
            href: `https://github.com/${p.repo}`
          }))}
        keyField="repo"
        render={row => <OpenSourceProjectTableRow project={row} />}
      />
    </WideSection>
  </Main>
);
