import React from "react";
import styled from "styled-components";
import { Image } from "rebass";

const Img = styled(Image)`
  max-width: 100%;
  width: auto;
  max-height: 100%;
`;

export default props => <Img {...props} />;
