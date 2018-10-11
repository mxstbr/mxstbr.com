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
import Logo from "./Logo";

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
