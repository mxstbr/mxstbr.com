import React from "react";
import { Flex, type RebassProps } from "rebass";

export default (props: RebassProps) => (
  <Flex
    as="main"
    flexDirection="column"
    alignItems={["center", "flex-start"]}
    {...props}
  />
);
