import React from "react";
import styled, { css } from "styled-components";
import timeout from "p-timeout";
import {
  Link,
  Flex,
  Box,
  Text as RebassText,
  Heading as RebassHeading
} from "rebass";
import Card from "./Card";
import { H3 } from "./Heading";
import Text from "./Text";
import { getGitHubRepo } from "../helpers/github-api";

const Title = props => <H3 {...props} lineHeight={1} my={0} />;
const Description = props => (
  <Text color="#666" fontSize={2} lineHeight={1.25} {...props} mb={4} mt={2} />
);
const FinePrint = props => <Text color="#666" fontSize={1} {...props} />;

const Wrapper = styled(Link).attrs({
  mr: 3,
  mb: 3
})`
  text-decoration: none;
  color: inherit;
  display: block;

  &:nth-child(3n) {
    margin-right: 0;
  }

  &:hover ${RebassHeading} {
    text-decoration: underline;
  }

  ${props =>
    props.light &&
    css`
      border: none;

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
          p={4}
          css={{
            height: `${212 - 64}px`,
            maxWidth: `292px`,
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
              <FinePrint>
                {stateStars || stars}
                &nbsp;★
              </FinePrint>
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
