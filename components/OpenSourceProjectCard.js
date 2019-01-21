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
import { Star } from "react-feather";
import Icon from "./Icon";
import Card from "./Card";
import { H3 } from "./Heading";
import Text from "./Text";

const StarIcon = props => (
  <Icon css={{ verticalAlign: "text-bottom" }} ml={1}>
    <Star size="1em" />
  </Icon>
);
const Title = props => <H3 {...props} fontSize={3} lineHeight={1} my={0} />;
const Description = props => (
  <Text color="#666" fontSize={2} lineHeight={1.25} {...props} mb={4} mt={2} />
);
const FinePrint = props => (
  <Text as="div" color="#666" fontSize={1} {...props} />
);

const Wrapper = styled(Link).attrs({
  m: [1, 2],
  mb: 2
})`
  text-decoration: none;
  color: inherit;
  display: block;

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

type Props = {
  repo: string,
  width?: number,
  stars: number,
  children: React$Node,
  light?: boolean,
  bg?: string
};

type State = {
  stars: ?number,
  data: ?{}
};

class OpenSourceProjectCard extends React.Component<Props, State> {
  static Title: typeof Title;
  static Description: typeof Description;

  render() {
    const { repo, width, children, light, bg } = this.props;

    return (
      <Wrapper
        width={[1, "calc(50% - 16px)", "calc(33.3% - 16px)"]}
        href={`https://github.com/${repo}`}
        light={light}
      >
        <Card
          p={[3, 4]}
          css={{
            minHeight: `${212 - 64}px`,
            background: bg
          }}
        >
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            css={{ height: "100%", minHeight: `${212 - 64}px` }}
          >
            <Box>{children}</Box>
            <Flex justifyContent="space-between">
              <FinePrint>{repo}</FinePrint>
              {this.props.stars != undefined && (
                <FinePrint width="5.1em" textAlign="right">
                  {this.props.stars.toLocaleString("en")}
                  <StarIcon />
                </FinePrint>
              )}
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
