import React from "react";
import styled from "styled-components";
import { Box } from "rebass";
import BoxShadow from "./BoxShadow";

export const TextButton = styled(Box).attrs({
  as: props => props.as || "button"
})`
  text-decoration: none;
  color: inherit;
  display: inline-block;
  color: ${props => props.theme.colors.primary};
  letter-spacing: 0.03em;
  font-weight: bold;
`;

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
  <BoxShadow borderRadius="5px">
    <Button {...props} />
  </BoxShadow>
);
