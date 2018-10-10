import React from "react";
import { Box } from "rebass";

export default props => (
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
