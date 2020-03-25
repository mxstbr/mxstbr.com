import React from "react";
import styled, { css } from "styled-components";
import { Flex } from "rebass";
import { Twitter, GitHub, Camera, Rss } from "react-feather";
import Link from "../Link";
import Text from "../Text";
import Layout from "../Layout";
import Icon from "../Icon";

const FooterColumn = (props: {
  title: string,
  width?: number,
  last?: boolean,
  children: React$Node
}) => (
  <Flex flexDirection="column" flex={1} mb={4} mr={props.last === true ? 0 : 4}>
    <Text mb={3} fontWeight="bold" color="#333">
      {props.title}
    </Text>
    {props.children}
  </Flex>
);

type ListItemProps = {
  Icon?: React$ComponentType<{ size: string }>,
  children: React$Node,
  href: string,
  rel?: string
};

const FooterListItem = ({
  Icon: IconComp,
  rel,
  children,
  href
}: ListItemProps) => (
  <Text as="div" my={1} color="#666">
    <Link href={href} rel={rel}>
      {IconComp && (
        <Icon mr={2} ml={0}>
          <IconComp size="1em" />
        </Icon>
      )}
      {children}
    </Link>
  </Text>
);

export default (props: {}) => (
  <Flex
    py={5}
    mt={5}
    as="footer"
    bg="#fff"
    css={css`
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    `}
  >
    <Layout width={[1, 0.5]}>
      <Flex flexDirection={["column", "row"]}>
        <FooterColumn title="About this place" width={0.5}>
          <Text color="#666" lineHeight={1.5}>
            Welcome to my personal website! I'm @mxstbr, a JavaScript Engineer
            from Austria 🇦🇹 and I love React and Node.
          </Text>
        </FooterColumn>
        <FooterColumn last title="Social Stuff">
          <FooterListItem
            Icon={GitHub}
            href="https://github.com/mxstbr/mxstbr.com"
            rel="me"
          >
            View source on GitHub
          </FooterListItem>
          <FooterListItem
            Icon={Twitter}
            rel="me"
            href="https://twitter.com/mxstbr"
          >
            Follow me on Twitter
          </FooterListItem>
          <FooterListItem Icon={Camera} href="https://instagram.com/mxstbr">
            See my stories on Instagram
          </FooterListItem>
          <FooterListItem Icon={Rss} href="https://mxstbr.com/rss">
            Subscribe to the RSS feed
          </FooterListItem>
        </FooterColumn>
      </Flex>
    </Layout>
  </Flex>
);
