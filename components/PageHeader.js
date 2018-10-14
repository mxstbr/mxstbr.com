import React from "react";
import { Flex, type RebassProps } from "rebass";
import SmallLayout from "./SmallLayout";

type Props = {
  ...$Exact<RebassProps>,
  children: React$Node
};

export default (props: Props) => (
  <Flex
    flexDirection="column"
    width={1}
    mb={4}
    justifyContent="center"
    {...props}
  >
    {props.children}
  </Flex>
);
