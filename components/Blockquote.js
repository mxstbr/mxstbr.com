import React from "react";
import styled from "styled-components";
import { Box, Flex } from "rebass";
import Text from "./Text";

const Blockquote = styled(Text).attrs({
  fontFamily: "system",
  fontSize: 3,
  my: 2
})`
  padding: 0 1.5em;
  position: relative;
  font-style: italic;
  line-height: 1.5em;
  color: #666;

  &:before {
    font-family: Georgia;
    display: block;
    content: "\\201C";
    font-size: 5pc;
    position: absolute;
    left: -1rem;
    top: -1rem;
    line-height: initial;
    color: #bbb;
  }
`;

export const Cite = styled(Text)`
  display: block;
  margin-top: 0.5em;
  color: #999;

  &:before {
    content: "— ";
  }
`;

export default Blockquote;
