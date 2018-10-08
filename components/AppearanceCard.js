import { Flex, Box, Link } from "rebass";
import styled from "styled-components";
import ConditionalWrap from "conditional-wrap";
import Text from "./Text";
import Heading from "./Heading";
import { getShortMonth } from "../utils/format-date";

const Badge = styled(Box)`
  border: 1px solid #999;
  border-radius: 3px;
  display: inline-flex;
  color: #999;
  align-items: center;
  justify-content: center;
  height: 1.1em;
`;

const Wrapper = styled(Flex).attrs({
  width: 734 - 16
})`
  max-width: 100%;

  ${Link}:hover .title {
    text-decoration: underline;
  }
`;

const AppearanceCard = props => (
  <Wrapper py={!!props.link ? 0 : 3} flexDirection="row" alignItems="center">
    <ConditionalWrap
      condition={!!props.link}
      wrap={children => (
        <Link
          py={3}
          color="inherit"
          css={{ textDecoration: "none" }}
          href={props.link}
          width={1}
        >
          <Flex flexDirection="row" alignItems="center">
            {children}
          </Flex>
        </Link>
      )}
    >
      <Flex flexDirection="column" mr={3} width={42 + 16}>
        <Text
          color="#666"
          fontSize={3}
          mb={1}
          css={{ letterSpacing: "0.075em" }}
        >
          {getShortMonth(props.date)}
        </Text>
      </Flex>
      <Flex flexDirection="column" width={1}>
        <Heading className="title" as="h4" fontSize={3} mb={1}>
          {props.title}
        </Heading>
        <Text color="#666" fontSize={2}>
          {props.site} {!!props.city && `(${props.city})`}
        </Text>
      </Flex>
      <Badge px={2}>
        <Text fontSize={1}>{props.type}</Text>
      </Badge>
    </ConditionalWrap>
  </Wrapper>
);

export default AppearanceCard;
