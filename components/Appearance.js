import { Flex, Box, Link } from "rebass";
import styled from "styled-components";
import ConditionalWrap from "conditional-wrap";
import Text from "./Text";
import Heading from "./Heading";
import { getShortMonth } from "../utils/format-date";
import ListItem from "./ListItem";

const Badge = styled(Box)`
  border: 1px solid #999;
  border-radius: 3px;
  display: inline-flex;
  color: #999;
  align-items: center;
  justify-content: center;
  height: 1.1em;
`;

const Wrapper = styled(ListItem)`
  ${Link}:hover .title {
    text-decoration: underline;
  }
`;

const AppearanceCard = props => (
  <Wrapper link={props.link}>
    <Flex mr={3} width={42 + 16}>
      <Text color="#666" fontSize={2}>
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
  </Wrapper>
);

export default AppearanceCard;
