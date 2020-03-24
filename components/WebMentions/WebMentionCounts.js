import React from "react";
import { withRouter, type Router } from "next/router";
import { Heart, MessageCircle } from "react-feather";
import Paragraph from "../Paragraph";
import Icon from "../Icon";
import blogposts from "../../data/blog-posts";

type Props = {
  router: Router,
  path?: string,
  size?: "small"
};

export default withRouter((props: Props) => {
  const path =
    typeof props.path === "string" ? props.path : props.router.pathname;
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
});
