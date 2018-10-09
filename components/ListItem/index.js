import { Flex, Link } from "rebass";
import styled from "styled-components";
import ConditionalWrap from "conditional-wrap";

const Item = styled(Flex)`
  max-width: 100%;
  width: 100%;
`;

export default props => (
  <Item
    className={props.className}
    py={!!props.link ? 0 : 3}
    flexDirection="row"
    alignItems="center"
  >
    <ConditionalWrap
      condition={!!props.link}
      wrap={children => (
        <Link
          py={3}
          color="inherit"
          css={{ textDecoration: "none" }}
          href={props.link}
          width={1}
        >
          <Flex flexDirection="row" alignItems="center">
            {children}
          </Flex>
        </Link>
      )}
    >
      {props.children}
    </ConditionalWrap>
  </Item>
);
