import React from "react";
import styled, { css } from "styled-components";
import NextLink from "next/link";
import { Flex, Link } from "rebass";
import { Twitter, Github, Camera } from "react-feather";
import Text from "../Text";
import Layout from "../Layout";
import Icon from "../Icon";

const footerLinkStyles = css`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  margin: 0 1em;

  &:hover {
    text-decoration: underline;
  }
`;

const NextLinkText = styled.a`
  ${footerLinkStyles};
`;

const FooterLink = styled(Link).attrs({
  target: "_blank"
})`
  ${footerLinkStyles};
`;

export default props => (
  <Flex
    py={4}
    mt={5}
    as="footer"
    css={{ borderTop: "1px solid #CCC" }}
    bg="#EEE"
  >
    <Layout width={0.5}>
      <Flex justifyContent="space-around">
        <Text color="#666">
          <FooterLink href="https://twitter.com/mxstbr">
            <Icon mr={2} ml={0}>
              <Twitter size="1em" />
            </Icon>
            Twitter
          </FooterLink>
        </Text>
        <Text mb={1} color="#666">
          <FooterLink href="https://github.com/mxstbr">
            <Icon mr={2} ml={0}>
              <Github size="1em" />
            </Icon>
            GitHub
          </FooterLink>
        </Text>
        <Text color="#666">
          <FooterLink href="https://unsplash.com/@mxstbr">
            <Icon mr={2} ml={0}>
              <Camera size="1em" />
            </Icon>
            Unsplash
          </FooterLink>
        </Text>
      </Flex>
    </Layout>
  </Flex>
);
