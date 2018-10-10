import React from "react";
import styled, { css } from "styled-components";
import { Flex, Box, Link } from "rebass";
import NextLink from "next/link";
import Icon from "../Icon";
import { ExternalLink as LinkExternal } from "react-feather";
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

const Wrapper = styled(Flex).attrs({
  as: "nav"
})`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;
  z-index: 9;
  box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px 0px;
  overflow-y: scroll;
`;

class Nav extends React.Component {
  render() {
    return (
      <IsScrolled>
        {({ isScrolled }) => (
          <Wrapper py={3}>
            <Layout py={1} width={1}>
              <Flex
                alignItems="center"
                justifyContent={["center", "space-between"]}
              >
                <Logo />
                <Flex
                  css={{ "@media (max-width: 700px)": { display: "none" } }}
                >
                  <NavItem href="/about" title="About" />
                  <NavItem href="/appearances" title="Appearances" />
                  <NavItem href="/audits" title="Audits" />
                  <NavItem
                    href="https://mxstbr.blog"
                    target="_blank"
                    title={
                      <>
                        Blog{" "}
                        <Icon ml={1}>
                          <LinkExternal size="1em" />
                        </Icon>
                      </>
                    }
                  />
                </Flex>
              </Flex>
            </Layout>
          </Wrapper>
        )}
      </IsScrolled>
    );
  }
}

export default Nav;
