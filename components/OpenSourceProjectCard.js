import React from "react";
import styled, { css } from "styled-components";
import timeout from "p-timeout";
import {
  Card,
  Link,
  Flex,
  Box,
  Text as RebassText,
  Heading as RebassHeading
} from "rebass";
import Heading from "./Heading";
import Text from "./Text";
import { getGitHubRepo } from "../helpers/github-api";

const Title = props => <Heading fontSize={3} as="h3" {...props} mb={2} />;
const Description = props => (
  <Text color="#666" fontSize={2} lineHeight={1.25} {...props} mb={4} />
);
const FinePrint = props => <Text color="#666" fontSize={1} {...props} />;

const Wrapper = styled(Link).attrs({
  mr: 3,
  my: 3
})`
  text-decoration: none;
  color: inherit;
  display: block;

  ${Card} {
    transition: box-shadow 150ms ease-in-out;
  }

  &:hover ${Card} {
    box-shadow: rgba(0, 0, 0, 0.15) 0px 8px 24px 0px;
  }

  &:hover ${RebassHeading} {
    text-decoration: underline;
  }

  ${props =>
    props.light &&
    css`
      ${RebassText} {
        color: #eee;
      }

      ${RebassHeading} {
        color: #fff;
      }
    `};
`;

class OpenSourceProjectCard extends React.Component {
  state = {
    stars: null,
    data: null
  };

  componentDidMount() {
    getGitHubRepo(this.props.repo)
      .then(data => {
        if (data) this.setState({ stars: data?.stargazers_count, data });
      })
      .catch(err => {
        console.error(err);
      });
  }

  render() {
    const { repo, width, stars, children, light, bg } = this.props;
    const { stateStars = stars } = this.state;

    return (
      <Wrapper href={`https://github.com/${repo}`} light={light}>
        <Card
          borderRadius={5}
          boxShadow="rgba(0, 0, 0, 0.15) 0px 3px 8px 0px"
          p={4}
          css={{
            height: `${212 - 64}px`,
            maxWidth: `${350 - 64}px`,
            background: bg
          }}
        >
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            css={{ height: "100%" }}
          >
            <Box>{children}</Box>
            <Flex justifyContent="space-between">
              <FinePrint>{repo}</FinePrint>
              <FinePrint>{stateStars || stars} stars</FinePrint>
            </Flex>
          </Flex>
        </Card>
      </Wrapper>
    );
  }
}

OpenSourceProjectCard.Title = Title;
OpenSourceProjectCard.Description = Description;

export default OpenSourceProjectCard;
