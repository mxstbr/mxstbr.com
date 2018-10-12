import React from "react";
import styled from "styled-components";
import { Flex, Box } from "rebass";

const ListDividerWrapper = styled(Flex)`
  &:first-of-type {
    margin-top: 0;
  }
`;

type Props = {
  children: React$Node
};

const ListDivider = (props: Props) => (
  <ListDividerWrapper
    flexDirection="row"
    alignItems="center"
    width={1}
    mb={2}
    mt={3}
  >
    {props.children}
    <Box css={{ background: "#BBB", width: "100%", height: "1px" }} />
  </ListDividerWrapper>
);

export default ListDivider;
