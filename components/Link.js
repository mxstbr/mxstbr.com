import React from "react";
import styled from "styled-components";
import { Link as RebassLink } from "rebass";
import { Link as GatsbyLink } from "gatsby";
import ConditionalWrap from "conditional-wrap";

const BaseLink = styled(RebassLink)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: ${props => props.underline !== false && "underline"};
  }

  ${props => props.css};
`;

const UniversalLink = props => {
  const href = props.href || "";
  const external = href.indexOf("//") !== -1 || href.indexOf("mailto") === 0;

  // TODO: Implement Gatsby's Link for internal links. Breaks styling.
  return (
    <BaseLink
      target={external ? "_blank" : undefined}
      rel={external ? "noopener" : undefined}
      as={!external ? GatsbyLink : RebassLink}
      to={href}
      {...props}
    />
  );
};

export default styled(UniversalLink)``;
