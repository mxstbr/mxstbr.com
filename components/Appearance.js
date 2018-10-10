import { Flex, Box, Link } from "rebass";
import styled from "styled-components";
import ConditionalWrap from "conditional-wrap";
import Text from "./Text";
import Heading from "./Heading";
import { getShortMonth } from "../utils/format-date";
import ListItem from "./ListItem";

import Icon from "./Icon";
import { Radio, Mic, Monitor, Terminal, Users } from "react-feather";

const ICONS = {
  podcast: Mic,
  interview: Radio,
  conference: Monitor,
  workshop: Terminal,
  meetup: Users
};

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

const AppearanceCard = props => {
  const TypeIcon = ICONS[props.type];
  return (
    <Wrapper link={props.link}>
      <Flex mr={3} width={50} justifyContent="center">
        <Icon color="#666" title={props.type}>
          <TypeIcon strokeWidth={1.5} />
        </Icon>
      </Flex>
      <Flex flexDirection="column" width={1} ml="4px">
        <Heading className="title" as="h4" fontSize={3} mb={1}>
          {props.title}
        </Heading>
        <Text color="#666" fontSize={2}>
          {props.site} {!!props.city && `(${props.city})`}
        </Text>
      </Flex>
    </Wrapper>
  );
};

export default AppearanceCard;
