// @noflow
import React from "react";
import { ExternalLink as LinkExternal } from "react-feather";
import { parse, format } from "date-fns";
import Link from "./Link";
import Card from "./Card";
import Icon from "./Icon";
import type { NewBlogPost, OldBlogPost } from "../data/blog-posts";

type OldBlogPostProps = {|
  old: OldBlogPost
|};

type NewBlogPostProps = {|
  post: NewBlogPost
|};

type Props = OldBlogPostProps | NewBlogPostProps;

export default (props: Props) => {
  let external;
  const date = props.old
    ? parse(props.old.date_published)
    : parse(props.post.publishedAt);
  const href = props.old ? props.old.url : props.post.path;
  if (props.old) {
    external =
      typeof props.old["_external-site"] === "string"
        ? props.old["_external-site"]
        : "mxstbr.blog";
  }
  const post = props.old || props.post;
  return (
    <Link
      href={href}
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
