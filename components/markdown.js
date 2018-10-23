import styled from "styled-components";
import { Box } from "rebass";
import { H2, H3, H4 } from "./Heading";
import Paragraph from "./Paragraph";
import Link from "./Link";
import { UnorderedList, OrderedList, ListItem } from "./HtmlLists";
import Image from "./Image";

const Code = styled(Box).attrs({
  as: "code",
  fontSize: 2
})`
  line-height: 1.4;
  font-family: Consolas, Monaco, monospace;
  color: ${props => props.theme.colors.text};
  border-radius: 3px;
`;

const Pre = styled(Box).attrs({
  as: "pre",
  p: 3,
  mb: 3
})`
  display: block;
  white-space: pre;
  white-space: pre-wrap;
  word-break: break-all;
  word-wrap: break-word;
  background-color: #edeff1;
  border-radius: 3px;
  overflow-x: scroll;
`;

export default {
  h2: H2,
  h3: H3,
  h4: H4,
  p: Paragraph,
  a: Link,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  img: Image,
  pre: props => <Pre {...props} />,
  code: props => <Code {...props} />,
  inlineCode: props => <code {...props} />
};
