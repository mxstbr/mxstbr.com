import React from "react";
import { Box } from "rebass";
import styled from "styled-components";
import Text from "./Text";
import Link from "./Link";

const Wrapper = styled(Box)`
  max-width: 35em;
  width: 100%;

  ${Link} {
    color: ${props => props.theme.colors.primary};
  }
`;

export default props => (
  <Wrapper>
    <Text {...props} mb={2} fontSize={2} lineHeight={1.7} />
  </Wrapper>
);
