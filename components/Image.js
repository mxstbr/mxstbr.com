import React from "react";
import styled from "styled-components";
import { Image, type RebassProps } from "rebass";

const Img = styled(Image)`
  max-width: 100%;
  width: auto;
  max-height: 100%;
`;

export default (props: RebassProps) => <Img {...props} />;
