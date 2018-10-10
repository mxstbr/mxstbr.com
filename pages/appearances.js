import React from "react";
import AppearancesList from "../components/AppearancesList";
import { H2 } from "../components/Heading";
import appearances from "../appearances";

export default () => (
  <>
    <H2 mt={4}>Appearances</H2>
    <AppearancesList appearances={appearances} />
  </>
);
