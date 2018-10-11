import React from "react";
import styled from "styled-components";
import { Flex, Box } from "rebass";
import { H3 } from "./Heading";
import Appearance from "./Appearance";

const YearDividerWrapper = styled(Flex)`
  &:first-of-type {
    margin-top: 0;
  }
`;

const YearDivider = props => (
  <YearDividerWrapper
    flexDirection="row"
    alignItems="center"
    width={1}
    mb={2}
    mt={3}
  >
    <H3 mr={3} width={50}>
      {props.year}
    </H3>
    <Box css={{ background: "#BBB", width: "100%", height: "1px" }} />
  </YearDividerWrapper>
);

export default ({ appearances }) => (
  <Flex flexDirection="column">
    {appearances.map((appearance, i) => (
      <React.Fragment key={appearance.title + appearance.site}>
        {!appearances[i - 1] ||
        appearances[i - 1].date.getFullYear() !==
          appearance.date.getFullYear() ? (
          <YearDivider year={appearance.date.getFullYear()} />
        ) : null}
        <Appearance {...appearance} />
      </React.Fragment>
    ))}
  </Flex>
);
