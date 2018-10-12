import React from "react";
import styled from "styled-components";
import {
  Flex,
  Heading as RebassHeading,
  Link as RebassLink,
  Box
} from "rebass";
import ConditionalWrap from "conditional-wrap";
import projects from "../open-source-projects";
import { ListItem } from "../components/Lists";
import Text from "../components/Text";
import Paragraph from "../components/Paragraph";
import Link from "../components/Link";
import Head from "../components/Head";
import Heading, { H2, H3 } from "../components/Heading";
import OSSProject from "../components/OpenSourceProjectCard";
import CardGrid from "../components/CardGrid";
import BoxShadow from "../components/BoxShadow";
import Main from "../components/Main";
import PageHeader from "../components/PageHeader";

const Row = styled(Flex)`
  &:hover ${RebassHeading} {
    text-decoration: underline;
  }
`;

const Td = styled.td`
  ${props => props.textAlign && `text-align: ${props.textAlign}`};
  ${props => props.padding && `padding: ${props.padding}`};

  ${RebassLink} {
    display: block;
    padding: 8px 0;

    &:hover {
      text-decoration: none;
    }
  }
`;

const Cell = props => (
  <Td textAlign={props.textAlign} padding={props.padding}>
    <ConditionalWrap
      condition={!!props.href}
      wrap={children => <Link href={props.href}>{children}</Link>}
    >
      {props.children || null}
    </ConditionalWrap>
  </Td>
);

const RowLink = styled(Link)`
  border-bottom: 1px solid #eee;

  &:last-of-type {
    border-bottom: none;
  }

  &:hover ${RebassHeading} {
    text-decoration: underline;
  }
`;

const Table = props => (
  <>
    <BoxShadow hoverShadow="none">
      <Flex
        flexDirection="column"
        bg="#fff"
        css={{ borderRadius: "5px", border: "1px solid #eee" }}
      >
        {props.projects.map(project => (
          <RowLink
            py={3}
            px={3}
            key={project.repo}
            href={`https://github.com/${project.repo}`}
            underline={false}
          >
            <Flex>
              <Flex width={0.2} alignItems="center" height={1}>
                <Heading as="h4" fontSize={2} alignSelf="center">
                  {project.name}
                </Heading>
              </Flex>
              <Flex alignItems="center" width={0.75} px={3}>
                <Text color="#666">{project.description}</Text>
              </Flex>
              <Flex alignItems="center" justifyContent="flex-end" width={0.06}>
                <Text textAlign="right" color="#666" fontSize={1}>
                  {project.stars.toLocaleString()}
                  &nbsp;★
                </Text>
              </Flex>
            </Flex>
          </RowLink>
        ))}
      </Flex>
    </BoxShadow>
    <Text color="#666" mt={3} fontSize={2}>
      Total: {props.projects.reduce((total, { stars }) => total + stars, 0)}
      &nbsp;★
    </Text>
  </>
);

export default () => (
  <Main>
    <Head
      title="My Open Source Projects - Max Stoiber (@mxstbr)"
      description="A list of most of the open source projects I've (co-) created and/or maintained."
    />
    <PageHeader>
      <H2 alignSelf="center" mt={[4, 5]}>
        My Open Source Projects{" "}
      </H2>
      <Paragraph centered>
        These are most of the open source projects I've (co-) created and am
        somewhat actively involved in or using. For the full list visit{" "}
        <Link href="https://github.com/mxstbr">
          my GitHub profile (@mxstbr)
        </Link>
        .
      </Paragraph>
    </PageHeader>
    <Table
      projects={projects
        .filter(p => p.active !== false)
        .sort((a, b) => b.stars - a.stars)}
    />
    <H2 my={null} mt={4} mb={3} fontSize={3}>
      Past Open Source Projects
    </H2>
    <Paragraph mb={3}>
      I used to work on these projects, but am either no longer involved with
      them or they are archived.
    </Paragraph>
    <Table
      projects={projects
        .filter(p => p.active === false)
        .sort((a, b) => b.stars - a.stars)}
    />
  </Main>
);
