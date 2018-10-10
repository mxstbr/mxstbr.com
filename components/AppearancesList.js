import React from "react";
import { Flex, Box } from "rebass";
import { H3 } from "./Heading";
import Appearance from "./Appearance";

export default ({ appearances }) => (
  <Flex flexDirection="column" width={734 - 16}>
    {appearances.map((appearance, i) => (
      <React.Fragment key={appearance.title + appearance.site}>
        {!appearances[i - 1] ||
        appearances[i - 1].date.getFullYear() !==
          appearance.date.getFullYear() ? (
          <Flex
            flexDirection="row"
            alignItems="center"
            width={734 - 16}
            mb={2}
            mt={3}
          >
            <H3 mr={3} width={42 + 10}>
              {appearance.date.getFullYear()}
            </H3>
            <Box css={{ background: "#BBB", width: "100%", height: "1px" }} />
          </Flex>
        ) : null}
        <Appearance {...appearance} />
      </React.Fragment>
    ))}
  </Flex>
);
