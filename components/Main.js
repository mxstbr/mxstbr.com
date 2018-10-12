import React from "react";
import { Flex } from "rebass";

export default props => (
  <Flex
    as="main"
    flexDirection="column"
    alignItems={["center", "flex-start"]}
    {...props}
  />
);
