import React from "react";
import styled from "styled-components";
import { Box, type RebassProps } from "rebass";
import BoxShadow from "./BoxShadow";

export const TextButton = styled(Box).attrs(props => ({
  as: props.as || "button"
}))`
  text-decoration: none;
  color: inherit;
  display: inline-block;
  color: ${props => props.theme.colors.primary};
  letter-spacing: 0.03em;
  font-weight: bold;
  background: transparent;
  border: none;
`;

const Button = styled(Box).attrs(props => ({
  as: props.as || "button",
  px: 3,
  py: 2
}))`
  background-color: #fff;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 0px 0px;
  text-decoration: none;
  color: ${props => props.color || "inherit"};
  display: inline-block;
  transition: box-shadow 250ms ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 1em;
  cursor: pointer;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 8px 0px;
  }
`;

type Props = {
  as: string | React$Component<{}>
};

export default (props: RebassProps) => (
  <BoxShadow borderRadius="5px" my={2}>
    <Button {...props} />
  </BoxShadow>
);
