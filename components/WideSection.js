import React from "react";
import styled from "styled-components";
import { Box, type RebassProps } from "rebass";

const WideSection = styled(Box)`
  @media screen and (max-width: ${props => props.theme.breakpoints[0]}) {
    max-width: 100%;
  }
`;

export default (props: RebassProps) => (
  <WideSection
    width={["100%", "150%", "200%"]}
    ml={[0, "-25%", "-50%"]}
    {...props}
  />
);
