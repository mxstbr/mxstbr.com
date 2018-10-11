import React from "react";
import styled, { css } from "styled-components";
import { Flex, Box } from "rebass";
import Link from "../Link";
import Icon from "../Icon";
import { ExternalLink as LinkExternal } from "react-feather";
import IsScrolled from "../WithIsScrolled";
import Text from "../Text";
import Heading from "../Heading";
import Layout from "../Layout";
import Logo from "./Logo";

const NavItem = styled(props => (
  <Box mr={4} className={props.className}>
    <Link prefetch href={props.href}>
      <Text color="#666">{props.title}</Text>
    </Link>
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
  background: ${props => props.theme.colors.background};
  z-index: 9;
  overflow-y: scroll;
  transition: background 250ms ease-in-out, box-shadow 250ms ease-in-out;

  ${props =>
    props.isScrolled &&
    css`
      background: #fff;
      box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 4px 0px;
    `};
`;

class Nav extends React.Component {
  render() {
    return (
      <IsScrolled>
        {({ isScrolled }) => (
          <Wrapper isScrolled={isScrolled} py={3}>
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
