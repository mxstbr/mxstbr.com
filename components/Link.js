import React from "react";
import styled from "styled-components";
import { Link } from "rebass";
import NextLink from "next/link";
import ConditionalWrap from "conditional-wrap";

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

export default props => {
  const external =
    props.href.indexOf("//") !== -1 && props.href.indexOf("mxstbr.blog") === -1;
  return (
    <ConditionalWrap
      condition={!external}
      wrap={children => (
        <NextLink href={props.href} prefetch={props.prefetch}>
          {children}
        </NextLink>
      )}
    >
      <StyledLink target={external && "_blank"} {...props} />
    </ConditionalWrap>
  );
};
