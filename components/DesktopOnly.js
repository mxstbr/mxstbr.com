import styled from "styled-components";
import { Flex } from "rebass";

const DesktopOnly = styled(Flex)`
  @media (max-width: 700px) {
    display: none;
  }
`;

export default DesktopOnly;
