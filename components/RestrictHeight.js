import React from "react";
import styled from "styled-components";
import { Box, Flex } from "rebass";

const Label = styled.label`
  display: block;
  width: 100%;
  cursor: pointer;

  &:after {
    display: flex;
    font-family: ${props => props.theme.fonts.system.join(", ")};
    height: 4em;
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
    background: linear-gradient(
      to top,
      rgb(238, 238, 238),
      rgba(238, 238, 238, 0.9)
    );
    align-items: center;
    justify-content: center;
  }
`;

const Checkbox = styled.input.attrs({
  type: "checkbox"
})`
  display: none;

  &:checked ~ ${Label}:after {
    content: "↑ Click to collapse";
    position: relative;
    bottom: initial;
    left: initial;
    background: none;
  }

  &:not(:checked) ~ ${Label}:after {
    content: "↓ Show all";
  }

  &:not(:checked) ~ ${Box} {
    max-height: ${props => props.maxHeight};
    overflow: hidden;
  }
`;

class RestrictHeight extends React.Component {
  state = {
    expanded: false
  };

  render() {
    const { expanded } = this.state;
    const { children, maxHeight } = this.props;

    return (
      <Flex
        flexDirection="column"
        style={{ position: "relative", width: "100%" }}
      >
        <Checkbox id={`rh-${maxHeight}`} maxHeight={maxHeight} />
        <Box>{children}</Box>
        <Label htmlFor={`rh-${maxHeight}`} />
      </Flex>
    );
  }
}

export default RestrictHeight;
