import React from "react";
import { Flex } from "rebass";
import AppearancesList from "../components/AppearancesList";
import { H2 } from "../components/Heading";
import appearances from "../appearances";

export default () => (
  <Flex flexDirection="column" width={[1, 0.5]}>
    <H2 mt={4}>Appearances</H2>
    <AppearancesList appearances={appearances} />
  </Flex>
);
