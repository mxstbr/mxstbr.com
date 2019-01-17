import React from "react";
import { withRouter } from "next/router";
import { Heart, MessageCircle } from "react-feather";
import Paragraph from "../Paragraph";
import Icon from "../Icon";
import FetchWebMentionCounts from "./FetchWebMentionCounts";

export default withRouter(props => (
  <FetchWebMentionCounts path={props.router.pathname}>
    {({ loading, error, data }) => {
      if (data) {
        return (
          <>
            <Icon verticalAlign="bottom" ml={0} mr={1}>
              <Heart size="1em" />
            </Icon>{" "}
            {data.like + data.repost || 0} likes{" "}
            <Icon ml={2} mr={1}>
              <MessageCircle size="1em" />
            </Icon>{" "}
            {data.mention + data.reply || 0} responses
          </>
        );
      }

      if (typeof error === "string") return error;

      return null;
    }}
  </FetchWebMentionCounts>
));
