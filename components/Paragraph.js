import React from "react";
import { Box } from "rebass";
import styled from "styled-components";
import Text from "./Text";
import Link from "./Link";

const Wrapper = styled(Box)`
  max-width: 35em;
  width: 100%;
  ${props => props.centered && `margin: 0 auto;`} ${Link} {
    color: ${props => props.theme.colors.primary};
  }
`;

export default props => (
  <Wrapper centered={props.centered}>
    <Text {...props} color="#333" mb={3} fontSize="18px" lineHeight={1.6} />
  </Wrapper>
);
