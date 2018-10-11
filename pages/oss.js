import React from "react";
import styled from "styled-components";
import { Flex, Heading as RebassHeading, Link as RebassLink } from "rebass";
import ConditionalWrap from "conditional-wrap";
import projects from "../open-source-projects";
import { ListItem } from "../components/Lists";
import Text from "../components/Text";
import Paragraph from "../components/Paragraph";
import Link from "../components/Link";
import Heading, { H2, H3 } from "../components/Heading";
import OSSProject from "../components/OpenSourceProjectCard";
import CardGrid from "../components/CardGrid";

const Row = styled.tr`
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

const Table = props => (
  <table>
    {props.projects.map(project => (
      <Row>
        <Cell href={`https://github.com/${project.repo}`}>
          <Heading as="h4" fontSize={2}>
            {project.name}
          </Heading>
        </Cell>
        <Cell href={`https://github.com/${project.repo}`} padding="0 1em">
          <Text color="#666">{project.description}</Text>
        </Cell>
        <Cell textAlign="right" href={`https://github.com/${project.repo}`}>
          <Text color="#666" fontSize={1}>
            {project.stars.toLocaleString()}
            &nbsp;★
          </Text>
        </Cell>
      </Row>
    ))}
    <Row>
      <Cell />
      <Cell padding="0 1em" />
      <Cell textAlign="right">
        <Text
          color="#666"
          fontSize={1}
          pt={2}
          mt={1}
          css={{ borderTop: "1px solid #666" }}
        >
          {props.projects.reduce((total, { stars }) => total + stars, 0)}
          &nbsp;★
        </Text>
      </Cell>
    </Row>
  </table>
);

export default () => (
  <Flex flexDirection="column">
    <H2 mb={3}>My Open Source Projects </H2>
    <Paragraph mb={3}>
      These are most of the open source projects I've (co-) created and am
      somewhat actively involved in or using. For the full list visit{" "}
      <Link href="https://github.com/mxstbr">my GitHub profile (@mxstbr)</Link>.
    </Paragraph>
    <Table
      projects={projects
        .filter(p => p.active !== false)
        .sort((a, b) => b.stars - a.stars)}
    />
    <H3 my={null} mt={4} mb={3}>
      Past Open Source Projects
    </H3>
    <Paragraph mb={3}>
      I used to work on these projects, but am either no longer involved with
      them or they are archived.
    </Paragraph>
    <Table
      projects={projects
        .filter(p => p.active === false)
        .sort((a, b) => b.stars - a.stars)}
    />
  </Flex>
);
