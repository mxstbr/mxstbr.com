import React from "react";
import styled from "styled-components";
import { Box } from "rebass";
import BoxShadow from "./BoxShadow";

const Button = styled(Box).attrs({
  as: props => props.as || "button",
  p: 3
})`
  background-color: #fff;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 0px 0px;
  text-decoration: none;
  color: inherit;
  display: inline-block;
  transition: box-shadow 250ms ease-in-out;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 8px 0px;
  }
`;

export default props => (
  <BoxShadow>
    <Button {...props} />
  </BoxShadow>
);
