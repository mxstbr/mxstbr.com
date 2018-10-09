import React from "react";
import AppearancesList from "../components/AppearancesList";
import Heading from "../components/Heading";
import appearances from "../appearances";

export default () => (
  <>
    <Heading fontSize={5} as="h2" mb={4} mt={2}>
      Appearances
    </Heading>
    <AppearancesList appearances={appearances} />
  </>
);
