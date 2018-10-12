import React from "react";
import { Flex, type RebassProps } from "rebass";

export default (props: RebassProps) => (
  <Flex flexDirection="row" flexWrap="wrap" m={[-1, -2]} {...props} />
);
