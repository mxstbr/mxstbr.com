import React from "react";
import styled, { css } from "styled-components";
import { Box, Link, Flex } from "rebass";
import NextLink from "next/link";
import Text from "../Text";
import IsScrolled from "../WithIsScrolled";
import Heading from "../Heading";

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

const NavItem = styled(props => (
  <Box mr={4} className={props.className}>
    <NextLink prefetch href={props.href}>
      <Link
        href={props.href}
        css={{ textDecoration: "none", color: "inherit" }}
        target={props.target}
      >
        <Text color="#666">{props.title}</Text>
      </Link>
    </NextLink>
  </Box>
))`
  &:last-of-type {
    margin-right: 0;
  }
`;

const Logo = () => (
  <NextLink prefetch href="/">
    <Link href="/" css={{ textDecoration: "none", color: "inherit" }}>
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
    </Link>
  </NextLink>
);

export default Logo;
