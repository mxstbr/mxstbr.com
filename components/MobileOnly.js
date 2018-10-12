import styled from "styled-components";
import { Flex } from "rebass";

const MobileOnly = styled(Flex)`
  display: none;

  @media screen and (max-width: ${props => props.theme.breakpoints[0]}) {
    display: flex;
  }
`;

export default MobileOnly;
