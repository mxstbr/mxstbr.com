import styled, { css } from "styled-components";
import { Box } from "rebass";
import Paragraph from "./Paragraph";
import type { RebassProps } from "rebass";

const baseListStyles = css`
  padding-left: 1em;
  list-style: initial;
  list-style-position: outside;
`;

export const UnorderedList = styled(Box).attrs({
  as: "ul",
  mb: 3
})`
  ${baseListStyles};
`;
export const OrderedList = styled.ol`
  ${baseListStyles};
`;
const ListItemText = styled(Paragraph).attrs({
  my: 1
})``;
export const ListItem = (props: RebassProps) => (
  <li>
    <ListItemText {...props} />
  </li>
);
