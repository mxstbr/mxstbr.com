import React from "react";
import { Flex, Box } from "rebass";
import styled from "styled-components";
import { withRouter, type Router } from "next/router";
import { parse, format } from "date-fns";
import Button from "./Button";
import Head from "./Head";
import { H3, H2 } from "./Heading";
import Text from "./Text";
import Paragraph from "./Paragraph";
import Link from "./Link";
import Icon from "./Icon";
import Card from "./Card";
import ViewMoreLink from "./ViewMoreLink";
import BreadcrumbLink from "./BreadcrumbLink";
import { ChevronLeft, Send } from "react-feather";
import type { NewBlogPost } from "../blog-posts";

type Props = {
  meta: NewBlogPost,
  children: React$Node,
  router: Router
};

const EmailInput = styled(Box).attrs({
  type: "email",
  as: "input",
  my: 2,
  mr: 2
})`
  font-size: 1em;
  border-radius: 3px;
  width: 15em;
  border: 1px solid ${props => props.theme.colors.greys[1]};
  padding: 0.5em;
`;

const NewsletterForm = () => (
  <Flex
    m={4}
    mt={2}
    as="form"
    action="https://buttondown.email/api/emails/embed-subscribe/mxstbr"
    method="post"
    target="popupwindow"
    onsubmit="window.open('https://buttondown.email/mxstbr', 'popupwindow')"
    alignItems="center"
  >
    <EmailInput
      flex={1}
      name="email"
      id="bd-email"
      placeholder="contact@mxstbr.com"
    />
    <input type="hidden" value="1" name="embed" />
    <Button color="tertiary" as="input" type="submit" value="Subscribe" />
  </Flex>
);

const BackToBlog = props => (
  <BreadcrumbLink {...props} color="primary" href="/thoughts">
    <Icon ml={0} mr={1}>
      <ChevronLeft size="1em" />
    </Icon>
    BACK TO BLOG
  </BreadcrumbLink>
);

export default withRouter(({ router, meta, children }: Props) => (
  <>
    <Head title={meta.title} description={meta.summary} image={meta.image} />
    <BackToBlog mb={4} mt={5} />
    <H2 mb={3} mt={4}>
      {meta.title}
    </H2>
    <Text mt={3} mb={4} color="quaternary">
      Published {format(parse(meta.publishedAt), "MMMM Do, YYYY")}
    </Text>
    {children}
    <hr />
    <Card hover={false} my={4}>
      <Card.Title css="margin-top: 0;">
        Subscribe to the newsletter{" "}
        <Icon>
          <Send size="1em" />
        </Icon>
      </Card.Title>
      <Card.Body mb={2}>
        Be the first to know when I post something new!
      </Card.Body>
      <NewsletterForm />
    </Card>
    <Paragraph>
      <Link
        href={`https://mobile.twitter.com/search?q=${encodeURIComponent(
          `https://mxstbr.com${router.pathname}`
        )}`}
      >
        Discuss on Twitter
      </Link>{" "}
      ·{" "}
      <Link
        href={`https://github.com/mxstbr/mxstbr.com/edit/master/pages${
          router.pathname
        }.md`}
      >
        Edit on GitHub
      </Link>
    </Paragraph>
  </>
));
