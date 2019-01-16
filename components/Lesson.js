import React from "react";
import { Zap } from "react-feather";
import { Flex, Box } from "rebass";
import { H3 } from "./Heading";
import Paragraph from "./Paragraph";
import Icon from "./Icon";

type Props = {
  title: string,
  body: string,
  first?: boolean,
  last?: boolean
};

export default (props: Props) => (
  <Box mt={4} mb={props.last !== false ? 5 : undefined}>
    {props.first !== false && (
      <Flex flexDirection="row" alignItems="center" width={1} mb={-3} mt={3}>
        <Box css={{ background: "#BBB", width: "100%", height: "1px" }} />

        <Icon ml={2} mr={2}>
          <Zap size="1.5em" color="#BBB" />
        </Icon>
        <Box css={{ background: "#BBB", width: "100%", height: "1px" }} />
      </Flex>
    )}
    <Paragraph my={4} fontFamily="serif">
      <strong>{props.title}</strong>: {props.body}
    </Paragraph>
    {props.last !== false && (
      <Box css={{ background: "#BBB", width: "100%", height: "1px" }} />
    )}
  </Box>
);
