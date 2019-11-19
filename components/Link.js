import React from "react";
import styled from "styled-components";
import { Link } from "rebass";
import NextLink from "next/link";
import ConditionalWrap from "conditional-wrap";

const UniversalLink = props => {
  const external = props.href.indexOf("//") !== -1;

  return (
    <ConditionalWrap
      condition={!external}
      wrap={children => <NextLink href={props.href}>{children}</NextLink>}
    >
      <Link
        target={external ? "_blank" : undefined}
        rel={external ? "noopener" : undefined}
        {...props}
      />
    </ConditionalWrap>
  );
};

export default styled(UniversalLink)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: ${props => props.underline !== false && "underline"};
  }

  ${props => props.css};
`;
