import React from "react";
import { Box, type RebassProps } from "rebass";
import styled from "styled-components";
import Text from "./Text";
import Link from "./Link";

const Wrapper = styled(Box)`
  max-width: 35em;
  width: 100%;
  position: relative;
  z-index: 1;
  ${props => props.centered && `margin: 0 auto;`} ${Link} {
    color: ${props => props.theme.colors.primary};
  }
`;

type Props = {
  ...$Exact<RebassProps>,
  centered?: boolean
};

export default ({ centered, as, ...props }: Props) => (
  <Wrapper centered={centered} as={as}>
    <Text color="#333" mb={3} fontSize="18px" lineHeight={1.6} {...props} />
  </Wrapper>
);
