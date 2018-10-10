import React from "react";
import { Box } from "rebass";

export default props => (
  <Box
    ml={2}
    {...props}
    css={{
      verticalAlign: "text-bottom",
      display: "inline-block",
      ...props.css
    }}
  />
);
