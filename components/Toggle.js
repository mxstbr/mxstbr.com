import React from "react";
import styled, { css } from "styled-components";
import { Box } from "rebass";

export const createToggle = (name: string) => {
  const Toggle = styled.label.attrs({
    htmlFor: name
  })``;

  const Display = styled(Box)``;

  const State = styled.input.attrs({
    type: "checkbox",
    id: name
  })`
    display: none;

    &:checked ~ ${Display} {
      display: block;
    }

    &:not(:checked) ~ ${Display} {
      display: none;
    }
  `;

  return { Toggle, State, Display };
};
