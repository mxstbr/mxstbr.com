import styled from "styled-components";
import { Card, Image } from "rebass";
import { H3 } from "./Heading";
import Text from "./Text";
import BoxShadow from "./BoxShadow";

const Title = styled(props => (
  <H3 pl={4} pr={4} pt={4} my={0} lineHeight={1} {...props} />
))``;

const BaseCard = styled(Card)`
  border-radius: 5px;
  background-color: ${props => props.theme.colors.white};

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
  <Text
    color="secondaryText"
    fontSize={2}
    lineHeight={1.25}
    px={4}
    mb={4}
    mt={2}
    {...props}
  />
);
C.Image = props => (
  <Image {...props} css={{ borderRadius: "5px 5px 0 0", ...props.css }} />
);
C.FinePrint = props => (
  <Text color="secondaryText" pb={4} pl={4} pr={4} fontSize={1} {...props} />
);

export default C;
