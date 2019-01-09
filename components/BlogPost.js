import React from "react";
import { Flex, Box } from "rebass";
import styled from "styled-components";
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
import { ChevronLeft, Send } from "react-feather";
import type { NewBlogPost } from "../blog-posts";

type Props = {
  meta: NewBlogPost,
  children: React$Node
};

const EmailInput = styled(Box).attrs({
  type: "email",
  as: "input",
  mt: 2,
  mr: 2
})`
  font-size: 1em;
  border-radius: 3px;
  width: 15em;
  border: 1px solid ${props => props.theme.colors.greys[1]};
  padding: 0.5em;
`;

const NewsletterForm = () => (
  <Box
    m={4}
    mt={2}
    as="form"
    action="https://buttondown.email/api/emails/embed-subscribe/mxstbr"
    method="post"
    target="popupwindow"
    onSubmit="window.open('https://buttondown.email/mxstbr', 'popupwindow')"
  >
    <EmailInput name="email" id="bd-email" placeholder="contact@mxstbr.com" />
    <input type="hidden" value="1" name="embed" />
    <Button as="input" type="submit" value="Subscribe" />
  </Box>
);

export default ({ meta, children }: Props) => (
  <>
    <Head title={meta.title} description={meta.summary} image={meta.image} />
    <H2 mb={3}>{meta.title}</H2>
    <Text mt={3} mb={4} color="tertiary">
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
          `https://mxstbr.com${meta.path}`
        )}`}
      >
        Discuss on Twitter
      </Link>{" "}
      •{" "}
      <Link
        href={`https://github.com/mxstbr/mxstbr.com/edit/master/pages${
          meta.path
        }.md`}
      >
        Edit on GitHub
      </Link>
    </Paragraph>
    <ViewMoreLink href="/blog">View all posts</ViewMoreLink>
  </>
);
