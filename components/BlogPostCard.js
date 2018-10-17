import React from "react";
import { LinkExternal } from "react-feather";
import Link from "./Link";
import Card from "./Card";
import Icon from "./Icon";

type BlogpostFrontmatter = {
  excerpt: string,
  title: string,
  external_site?: string,
  external_url?: string,
  image?: string,
  twitter_large?: boolean
};

type Props = {
  meta: BlogpostFrontmatter
};

export default ({ meta }) => (
  <Link
    href={`https://mxstbr.com/blog/`}
    key={post.id}
    width={[1, "calc(50% - 16px)", "calc(33.3% - 16px)"]}
    m={[1, 2]}
    mb={2}
  >
    <Card>
      <Card.Title>{post.title}</Card.Title>
      <Card.Body css={{ maxHeight: "5em", overflow: "hidden" }}>
        {post.summary}
      </Card.Body>
      <Card.FinePrint>
        {format(date, "Do MMM")}
        {` on `}
        {external != undefined ? `the ${external}` : `mxstbr.blog`}
        {external != undefined && (
          <Icon css={{ verticalAlign: "text-bottom" }}>
            <LinkExternal size="1em" />
          </Icon>
        )}
      </Card.FinePrint>
    </Card>
  </Link>
);
