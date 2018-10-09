import styled from "styled-components";
import { Card, Image } from "rebass";
import Heading from "./Heading";
import Text from "./Text";

const Title = styled(props => (
  <Heading fontSize={3} as="h3" pl={4} pr={4} pt={4} mb={2} {...props} />
))``;

const C = styled(Card)`
  transition: box-shadow 150ms ease-in-out;
  box-shadow: rgba(0, 0, 0, 0.15) 0px 3px 8px 0px;
  border-radius: 5px;
  background-color: #fff;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.15) 0px 8px 24px 0px;

    ${Title} {
      text-decoration: underline;
    }
  }
`;

C.Title = Title;
C.Body = props => (
  <Text color="#666" fontSize={2} lineHeight={1.25} px={4} mb={4} {...props} />
);
C.Image = props => (
  <Image {...props} css={{ borderRadius: "5px 5px 0 0", ...props.css }} />
);
C.FinePrint = props => (
  <Text color="#666" pb={4} pl={4} pr={4} fontSize={1} {...props} />
);

export default C;
