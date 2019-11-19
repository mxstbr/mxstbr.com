import React from "react";
import styled, { css } from "styled-components";
import { Box, Flex } from "rebass";
import Link from "../Link";
import Text from "../Text";
import IsScrolled from "../WithIsScrolled";
import Heading from "../Heading";

const LogoLink = styled(Link)`
  &:hover {
    text-decoration: none;
  }
`;

const shouldShow = props => {
  if (props.scrolled) {
    if (props.showOnScroll) return true;
    if (props.hideOnScroll) return false;
  }
  if (props.showOnScroll) return false;
  return true;
};

const Handle = styled.span`
  transition: opacity 250ms ease-out, margin 250ms ease-in-out;
  ${props => {
    if (shouldShow(props)) {
      return css`
        opacity: 1;
      `;
    }
    return css`
      opacity: 0;
      margin-right: ${props.marginOnHide || "-.5em"};
    `;
  }};
`;

const Logo = () => (
  <LogoLink href="/">
    <Flex
      flexDirection="column"
      justifyContent="center"
      css={{ width: "144px" }}
    >
      <IsScrolled>
        {({ isScrolled }) => (
          <>
            <Heading
              css={{ transition: "margin 250ms ease-in-out" }}
              as="h1"
              fontSize={3}
              fontWeight="normal"
              fontFamily="serif"
              alignSelf={["center", "flex-start"]}
            >
              <Handle scrolled={isScrolled} showOnScroll>
                &lt;
              </Handle>
              m
              <Handle scrolled={isScrolled} hideOnScroll>
                a
              </Handle>
              x
              <Handle scrolled={isScrolled} hideOnScroll marginOnHide="-.2em">
                &nbsp;
              </Handle>
              st
              <Handle
                scrolled={isScrolled}
                hideOnScroll
                marginOnHide="-.5em; margin-left: -0.34em;"
              >
                oi
              </Handle>
              b
              <Handle scrolled={isScrolled} hideOnScroll>
                e
              </Handle>
              r
              <Handle scrolled={isScrolled} default={0} showOnScroll>
                &nbsp;/&gt;
              </Handle>
            </Heading>
          </>
        )}
      </IsScrolled>
    </Flex>
  </LogoLink>
);

export default Logo;
