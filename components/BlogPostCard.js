import React from "react";
import { ExternalLink as LinkExternal } from "react-feather";
import { parse, format } from "date-fns";
import Link from "./Link";
import Card from "./Card";
import Icon from "./Icon";
import type { BlogPost } from "../blog-posts";

type Props = {
  post: BlogPost
};

export default (props: Props) => {
  const { post } = props;
  const external =
    typeof post["_external-site"] === "string"
      ? post["_external-site"]
      : typeof post.url === "string"
        ? "mxstbr.blog"
        : undefined;
  const date = parse(
    typeof post.date_published === "string"
      ? post.date_published
      : post.publishedAt
  );
  return (
    <Link
      href={typeof post.url === "string" ? post.url : post.path}
      target={external != undefined ? "_blank" : undefined}
      width={[1, "calc(50% - 16px)", "calc(33.3% - 16px)"]}
      css="&:hover&:hover { text-decoration: none; }"
      m={[1, 2]}
      mb={2}
    >
      <Card>
        <Card.Title>{post.title}</Card.Title>
        <Card.Body css={{ maxHeight: "5em", overflow: "hidden" }}>
          {post.summary}
        </Card.Body>
        <Card.FinePrint>
          {format(date, "MMM Do, YYYY")}
          {external != undefined && ` • ${external}`}
          {external != undefined && (
            <Icon css={{ verticalAlign: "text-bottom" }}>
              <LinkExternal size="1em" />
            </Icon>
          )}
        </Card.FinePrint>
      </Card>
    </Link>
  );
};
