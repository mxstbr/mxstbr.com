import { H2, H3 } from "./Heading";
import Paragraph from "./Paragraph";
import Link from "./Link";
import { UnorderedList, OrderedList, ListItem } from "./HtmlLists";
import Image from "./Image";

export default {
  h2: H2,
  h3: H3,
  p: Paragraph,
  a: Link,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  img: Image
};
