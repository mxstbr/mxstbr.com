import React from "react";
import { Flex, type RebassProps } from "rebass";

export default (props: RebassProps) => (
  <Flex width={[1, 1, 0.5]} flexDirection="column" {...props} />
);
