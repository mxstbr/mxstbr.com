import React from "react";
import { withRouter, type Router } from "next/router";
import { Heart, MessageCircle } from "react-feather";
import Paragraph from "../Paragraph";
import Icon from "../Icon";
import FetchWebMentionCounts from "./FetchWebMentionCounts";

type Props = {
  router: Router,
  path?: string,
  size?: "small"
};

export default withRouter((props: Props) => (
  <FetchWebMentionCounts
    path={typeof props.path === "string" ? props.path : props.router.pathname}
  >
    {({ loading, error, data }) => {
      if (data) {
        return (
          <>
            <Icon ml={0} mr={1}>
              <Heart size="1em" />
            </Icon>{" "}
            {data.like + data.repost || 0} {props.size !== "small" && `likes `}
            <Icon ml={2} mr={1}>
              <MessageCircle size="1em" />
            </Icon>{" "}
            {data.mention + data.reply || 0}{" "}
            {props.size !== "small" && `responses`}
          </>
        );
      }

      if (typeof error === "string") return error;

      return null;
    }}
  </FetchWebMentionCounts>
));
