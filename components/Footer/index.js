import React from "react";
import styled, { css } from "styled-components";
import { Flex } from "rebass";
import { Twitter, Github, Camera } from "react-feather";
import Link from "../Link";
import Text from "../Text";
import Layout from "../Layout";
import Icon from "../Icon";

export default (props: {}) => (
  <Flex
    py={4}
    mt={5}
    as="footer"
    css={{ borderTop: "1px solid #CCC" }}
    bg="#EEE"
  >
    <Layout width={[1, 0.5]}>
      <Flex justifyContent={["space-around", "space-between"]}>
        <Text color="#666">
          <Link href="https://twitter.com/mxstbr">
            <Icon mr={2} ml={0}>
              <Twitter size="1em" />
            </Icon>
            Twitter
          </Link>
        </Text>
        <Text mb={1} color="#666">
          <Link href="https://github.com/mxstbr/mxstbr.com">
            <Icon mr={2} ml={0}>
              <Github size="1em" />
            </Icon>
            View Source
          </Link>
        </Text>
        <Text color="#666">
          <Link href="https://unsplash.com/@mxstbr">
            <Icon mr={2} ml={0}>
              <Camera size="1em" />
            </Icon>
            Unsplash
          </Link>
        </Text>
      </Flex>
    </Layout>
  </Flex>
);
