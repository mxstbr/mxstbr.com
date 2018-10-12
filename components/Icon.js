import React from "react";
import { Box, type RebassProps } from "rebass";

export default (props: RebassProps) => (
  <Box
    ml={1}
    {...props}
    css={{
      verticalAlign: "middle",
      display: "inline-block",
      ...props.css
    }}
  />
);
