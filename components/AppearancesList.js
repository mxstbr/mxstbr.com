import React from "react";
import { Flex } from "rebass";
import { H3 } from "./Heading";
import Appearance from "./Appearance";
import { ListDivider } from "./Lists";

export default ({ appearances }) => (
  <Flex flexDirection="column">
    {appearances.map((appearance, i) => (
      <React.Fragment key={appearance.title + appearance.site}>
        {!appearances[i - 1] ||
        appearances[i - 1].date.getFullYear() !==
          appearance.date.getFullYear() ? (
          <ListDivider>
            <H3 mr={3} width={50}>
              {appearance.date.getFullYear()}
            </H3>
          </ListDivider>
        ) : null}
        <Appearance {...appearance} />
      </React.Fragment>
    ))}
  </Flex>
);
