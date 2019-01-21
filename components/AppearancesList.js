import React from "react";
import { Flex } from "rebass";
import { H3 } from "./Heading";
import Appearance from "./Appearance";
import { ListDivider } from "./Lists";
import type { Appearance as AppearanceType } from "../data/appearances";

type Props = {
  appearances: Array<AppearanceType>
};

export default ({ appearances }: Props) => (
  <Flex flexDirection="column">
    {appearances.map((appearance, i) => (
      <React.Fragment key={appearance.title + appearance.site}>
        {!appearances[i - 1] ||
        appearances[i - 1].date.getFullYear() !==
          appearance.date.getFullYear() ? (
          <ListDivider>
            <H3 mr={3} mt={2} mb={2} width={50}>
              {appearance.date.getFullYear()}
            </H3>
          </ListDivider>
        ) : null}
        <Appearance {...appearance} />
      </React.Fragment>
    ))}
  </Flex>
);
