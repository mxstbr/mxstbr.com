import React from "react";
import { Flex } from "rebass";
import AppearancesList from "../components/AppearancesList";
import { H2 } from "../components/Heading";
import Head from "../components/Head";
import appearances from "../appearances";
import Paragraph from "../components/Paragraph";

export default () => (
  <Flex flexDirection="column" width={[1, 0.5]}>
    <Head
      title="My Appearances - Max Stoiber (@mxstbr)"
      description="All my talks, podcasts and interviews of the past couple years in one place."
    />
    <H2 mt={[4, 5]}>My Appearances</H2>
    <Paragraph>
      These are all the talks I've given, podcasts I've recorded, meetups I've
      spoken at and interviews I've been a part of of the past couple years.
    </Paragraph>
    <AppearancesList appearances={appearances} />
  </Flex>
);
