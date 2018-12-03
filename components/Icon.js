import React from "react";
import styled from "styled-components";
import { Box, type RebassProps } from "rebass";

export default styled(Box).attrs({
  ml: 1,
  css: props => ({
    verticalAlign: "middle",
    display: "inline-block",
    ...props.css
  })
})``;
