import React from "react";
import styled, { css } from "styled-components";
import { Flex, Box } from "rebass";
import Link from "next/link";
import IsScrolled from "../WithIsScrolled";
import Text from "../Text";
import Heading from "../Heading";
import Layout from "../Layout";

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
  <Flex
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    css={{ width: "144px" }}
  >
    <IsScrolled>
      {({ isScrolled }) => (
        <>
          <Heading
            mt={isScrolled ? "16px" : 0}
            css={{ transition: "margin 250ms ease-in-out" }}
            as="h1"
            fontSize={3}
            fontWeight="normal"
            fontFamily="serif"
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
          <Handle scrolled={isScrolled} hideOnScroll>
            <Text fontSize={2} fontWeight="normal">
              JavaScript Engineer
            </Text>
          </Handle>
        </>
      )}
    </IsScrolled>
  </Flex>
);

const Wrapper = styled(Flex).attrs({
  as: "nav",
  py: 1
})`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;
  transition: box-shadow 250ms ease-in-out;
  z-index: 9;

  ${props =>
    props.showShadow &&
    css`
      box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px 0px;
    `};
`;

class Nav extends React.Component {
  render() {
    return (
      <IsScrolled>
        {({ isScrolled }) => (
          <Wrapper showShadow={isScrolled}>
            <Layout width={1}>
              <Flex alignItems="center">
                <Logo />
                <Box mr={3} />
                <Box mr={2}>
                  <Link href="/about">
                    <Text>About</Text>
                  </Link>
                </Box>
                <Box mr={2}>
                  <Link href="https://mxstbr.blog">
                    <Text>Blog</Text>
                  </Link>
                </Box>
              </Flex>
            </Layout>
          </Wrapper>
        )}
      </IsScrolled>
    );
  }
}

export default Nav;
