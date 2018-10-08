import styled from "styled-components";
import { Card } from "rebass";

const C = styled(Card)`
  transition: box-shadow 150ms ease-in-out;
  box-shadow: rgba(0, 0, 0, 0.15) 0px 3px 8px 0px;
  border-radius: 5px;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.15) 0px 8px 24px 0px;
  }
`;

export default props => <C p={4} {...props} />;
