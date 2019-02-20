import React from "react";
import { withRouter, type Router } from "next/router";
import { Box } from "rebass";
import { Twitter } from "react-feather";
import FetchWebMentionResponses from "./FetchWebMentionReponses";
import Paragraph from "../Paragraph";
import Button from "../Button";
import WebMentionItem from "./WebMentionItem";
import Icon from "../Icon";

type Props = {
  router: Router,
  path?: string
};

export default withRouter((props: Props) => (
  <FetchWebMentionResponses
    path={typeof props.path === "string" ? props.path : props.router.pathname}
  >
    {({ data, error, loading, loadNextPage, hasNextPage }) => (
      <>
        {!Array.isArray(data) ? (
          <Paragraph>Loading...</Paragraph>
        ) : (
          <div>
            {data
              .filter(mention => mention.content && mention.content.text)
              .map(mention => (
                <WebMentionItem key={mention["wm-id"]} mention={mention} />
              ))}
            {hasNextPage === true && (
              <Button disabled={loading} onClick={() => loadNextPage()}>
                {loading === true ? "Loading..." : "Load more"}
              </Button>
            )}
            <Box as="span" ml={hasNextPage === true ? 2 : 0}>
              <Button
                onClick={() =>
                  (window.location = `https://twitter.com/intent/tweet/?text=${`My thoughts on https://mxstbr.com${
                    props.router.pathname
                  }/`}`)
                }
              >
                Post comment{" "}
                <Icon>
                  <Twitter size="0.9em" />
                </Icon>
              </Button>
            </Box>
          </div>
        )}
        <Paragraph fontSize={1} color="tertiary" mt={3}>
          When you post a tweet with a link to this post it will automatically
          show up here! (refreshed every 30 minutes) 💯
        </Paragraph>
      </>
    )}
  </FetchWebMentionResponses>
));
