import React from "react";
import { Flex, type RebassProps } from "rebass";
import SmallLayout from "./SmallLayout";

type Props = {
  ...$Exact<RebassProps>,
  children: React$Node
};

export default (props: Props) => (
  <Flex flexDirection="row" width={1} mb={4} justifyContent="center" {...props}>
    <SmallLayout>{props.children}</SmallLayout>
  </Flex>
);
