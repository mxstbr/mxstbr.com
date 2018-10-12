import { Flex, Link } from "rebass";
import styled from "styled-components";
import ConditionalWrap from "conditional-wrap";

const Item = styled(Flex)`
  max-width: 100%;
  width: 100%;

  &:last-of-type,
  &:last-of-type ${Link} {
    padding-bottom: 0;
  }
`;

type Props = {
  className?: string,
  link?: string,
  children: React$Node
};

export default (props: Props) => (
  <Item
    className={props.className}
    py={props.link != undefined ? 0 : 3}
    flexDirection="row"
    alignItems="center"
  >
    <ConditionalWrap
      condition={props.link != undefined}
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
