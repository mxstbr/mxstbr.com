import React from "react";
import styled, { css } from "styled-components";
import { Flex, Box } from "rebass";
import { withRouter, type Router } from "next/router";
import Link from "../Link";
import Icon from "../Icon";
import { ExternalLink as LinkExternal, Menu, X, Twitter } from "react-feather";
import IsScrolled from "../WithIsScrolled";
import Text from "../Text";
import Heading from "../Heading";
import Layout from "../Layout";
import Logo from "./Logo";
import { createToggle } from "../Toggle";
import MobileOnly from "../MobileOnly";
import DesktopOnly from "../DesktopOnly";

const { Toggle, State, Display } = createToggle("mobile-menu");

const MobileMenu = styled(Flex)`
  align-items: center;
  justify-content: center;
  background: #fff;
  width: 100%;
  height: 100%;
`;

const NavItem = withRouter(styled(props => {
  const active = props.router.pathname.indexOf(props.href) === 0;
  return (
    <Box mr={4} className={props.className}>
      <Link itemProp="url" href={props.href}>
        <Text
          color={active ? "text" : "#666"}
          fontWeight={active ? "bold" : "normal"}
          itemProp="name"
        >
          {props.title}
        </Text>
      </Link>
    </Box>
  );
})`
  &:last-of-type {
    margin-right: 0;
  }
`);

const MobileNavItem = props => (
  <Box p={3} onClick={props.onClick}>
    <Link href={props.href}>
      <Text color="#333" as="div" fontSize={4} fontWeight="bold">
        {props.title}
      </Text>
    </Link>
  </Box>
);

const Wrapper = styled(Flex).attrs({
  as: "nav"
})`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: ${props => props.theme.colors.background};
  z-index: 9;
  transition: background 250ms ease-in-out, box-shadow 250ms ease-in-out;

  .no-js & {
    background: #fff;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px 0px;
  }

  @media screen and (max-width: ${props => props.theme.breakpoints[0]}) {
    background: #fff;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px 0px;
  }

  ${props =>
    props.isScrolled &&
    css`
      background: #fff;
      box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px 0px;
    `};
`;

class Nav extends React.Component<{}> {
  menu: ?HTMLInputElement;

  closeMenu = () => {
    if (this.menu) this.menu.checked = false;
  };

  render() {
    return (
      <IsScrolled>
        {({ isScrolled }) => (
          <>
            <Wrapper isScrolled={isScrolled} py={3}>
              <Layout py={1} width={1}>
                <Flex
                  alignItems="center"
                  justifyContent={["center", "space-between"]}
                >
                  <Logo />
                  <DesktopOnly
                    itemScope
                    itemType="http://www.schema.org/SiteNavigationElement"
                  >
                    <NavItem href="https://notes.mxstbr.com" title="Notes" />
                    <NavItem href="/thoughts" title="Blog" />
                    <NavItem href="/appearances" title="Appearances" />
                    <NavItem href="/oss" title="OSS" />
                    {/* <NavItem href="/audits" title="Audits" /> */}
                  </DesktopOnly>
                </Flex>
              </Layout>
            </Wrapper>
            <MobileOnly
              css={{
                position: "fixed",
                top: "21px",
                right: "16px",
                zIndex: 10
              }}
            >
              <Toggle>
                <Icon>
                  <Menu style={{ verticalAlign: "bottom" }} />
                </Icon>
              </Toggle>
            </MobileOnly>
            <MobileOnly>
              <State ref={elem => (this.menu = elem)} />
              <Display
                css={{
                  position: "fixed",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 11
                }}
              >
                <Toggle>
                  <Icon
                    css={{
                      position: "absolute",
                      right: "16px",
                      top: "21px"
                    }}
                  >
                    <X style={{ verticalAlign: "bottom" }} />
                  </Icon>
                </Toggle>
                <MobileMenu flexDirection="column">
                  <MobileNavItem
                    href="/"
                    title="Home"
                    onClick={this.closeMenu}
                  />
                  <MobileNavItem
                    href="https://notes.mxstbr.com"
                    onClick={this.closeMenu}
                    title="Notes"
                  />
                  <MobileNavItem
                    href="/thoughts"
                    onClick={this.closeMenu}
                    title="Blog"
                  />
                  <MobileNavItem
                    href="/appearances"
                    title="Appearances"
                    onClick={this.closeMenu}
                  />
                  <MobileNavItem
                    href="/oss"
                    title="OSS"
                    onClick={this.closeMenu}
                  />
                  {/* <MobileNavItem
                          href="/audits"
                          title="Audits"
                          onClick={this.closeMenu}
                        /> */}
                  <MobileNavItem
                    href="https://twitter.com/mxstbr"
                    onClick={this.closeMenu}
                    title={
                      <>
                        @mxstbr{" "}
                        <Icon ml={1}>
                          <Twitter size="1em" />
                        </Icon>
                      </>
                    }
                  />
                </MobileMenu>
              </Display>
            </MobileOnly>
          </>
        )}
      </IsScrolled>
    );
  }
}

export default Nav;
