import React from "react";
import styled from "styled-components";
import { Box, Flex } from "rebass";

const Label = styled.label`
  display: block;
  position: absolute;
  bottom: -2em;
  left: 0;
  /* transform: translateX(-50%); */

  &:after {
    font-family: ${props => props.theme.fonts.system.join(", ")};
    text-decoration: underline;
  }
`;

const Gradient = styled(Box)`
  height: 4em;
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  background: linear-gradient(
    to top,
    rgb(238, 238, 238),
    rgba(238, 238, 238, 0)
  );
`;

const Checkbox = styled.input.attrs({
  type: "checkbox"
})`
  display: none;

  &:checked ~ ${Gradient} {
    display: none;
  }

  &:checked ~ ${Label}:after {
    content: "↑ Click to collapse";
  }

  &:not(:checked) ~ ${Label}:after {
    content: "↓ Click to expand";
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
      <Flex style={{ position: "relative", width: "100%" }} mb={4}>
        <Checkbox id={`rh-${maxHeight}`} maxHeight={maxHeight} />
        <Box>{children}</Box>
        <Gradient />
        <Label htmlFor={`rh-${maxHeight}`} />
      </Flex>
    );
  }
}

export default RestrictHeight;
