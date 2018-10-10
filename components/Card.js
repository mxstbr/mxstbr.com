import styled from "styled-components";
import { Card, Image } from "rebass";
import { H3 } from "./Heading";
import Text from "./Text";
import BoxShadow from "./BoxShadow";

const Title = styled(props => (
  <H3 pl={4} pr={4} pt={4} mb={2} mt={0} {...props} />
))``;

const BaseCard = styled(Card)`
  border-radius: 5px;
  background-color: #fff;

  &:hover {
    ${Title} {
      text-decoration: underline;
    }
  }
`;

const C = props => (
  <BoxShadow borderRadius="5px">
    <BaseCard {...props} />
  </BoxShadow>
);

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
