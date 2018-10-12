import React from "react";
import { Flex } from "rebass";
import SmallLayout from "./SmallLayout";

export default props => (
  <Flex flexDirection="row" width={1} mb={4} justifyContent="center" {...props}>
    <SmallLayout>{props.children}</SmallLayout>
  </Flex>
);
