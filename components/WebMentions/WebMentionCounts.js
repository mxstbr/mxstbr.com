import React from "react";
import { Heart, MessageCircle } from "react-feather";
import { useLocation } from "@reach/router";
import Paragraph from "../Paragraph";
import Icon from "../Icon";
import blogposts from "../../data/blog-posts";

type Props = {
  path?: string,
  size?: "small"
};

export default (props: Props) => {
  const location = useLocation();
  const path = typeof props.path === "string" ? props.path : location.pathname;
  const post = blogposts.find(post => post.path === path);

  // $FlowIssue
  if (post && post.likes && post.likes > 0) {
    return (
      <>
        <Icon ml={0} mr={1}>
          <Heart size="1em" />
        </Icon>{" "}
        {post.likes} {props.size !== "small" && `likes `}
      </>
    );
  }

  return null;
};
