import React from "react";
import styled, { css } from "styled-components";
import { Card } from "rebass";

const BoxShadow = styled(Card)`
  display: ${props => props.display || "inline-block"};
  box-shadow: ${props => props.shadow || "rgba(0, 0, 0, 0.1) 0px 3px 8px 0px"};
  position: relative;
  background: transparent;

  ${props =>
    props.hoverShadow !== false &&
    css`
      &:after {
        content: "";
        box-shadow: ${props.hoverShadow ||
          "rgba(0, 0, 0, 0.15) 0px 8px 24px 0px"};
        opacity: 0;
        transition: opacity 250ms ease-in-out;
        position: absolute;
        z-index: -1;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
      }

      &:hover::after {
        opacity: 1;
      }
    `};
`;

export default BoxShadow;
