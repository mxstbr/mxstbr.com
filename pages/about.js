import React from "react";
import { Flex, Box } from "rebass";
import Link from "../components/Link";
import { H2 } from "../components/Heading";
import Paragraph from "../components/Paragraph";
import Head from "../components/Head";
import Image from "../components/Image";

export default () => (
  <Flex flexDirection="column" alignItems="center" justifyContent="center">
    <Head title="About me - Max Stoiber (@mxstbr)" />
    <Box>
      <H2 mt={4}>Hey, I'm Max! 👋</H2>
      <Flex flexDirection="row">
        <Box width="50%">
          <Paragraph>
            I've (co-) created and maintain a lot of{" "}
            <Link href="/#open-source">open source projects</Link> in the
            JavaScript ecosystem, mainly in the React and Node ecosystems.
          </Paragraph>
          <Paragraph>
            If I'm not in front of my laptop coding, I'm either brewing some
            cappucinos on my La Spaziale espresso machine (as seen on the
            right), touring around the world or skiing.
          </Paragraph>
          <Box css={{ width: "100%" }}>
            <Image
              src="/static/images/speaking.jpg"
              alt="Max speaking at a conference"
              css={{ width: "100%", height: "auto" }}
            />
          </Box>
        </Box>
        <Box css={{ width: "25%" }} ml={4}>
          <Image
            src="/static/images/making-coffee.jpg"
            alt="Max pouring latte art at home"
            css={{ width: "100%", height: "auto" }}
          />
        </Box>
      </Flex>
      <Box />
    </Box>
  </Flex>
);
