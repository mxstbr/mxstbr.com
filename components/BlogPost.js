import React from "react";
import { Flex } from "rebass";
import styled from "styled-components";
import Button from "./Button";
import PageHeader from "./PageHeader";
import { H3 } from "./Heading";
import Text from "./Text";
import Paragraph from "./Paragraph";
import Link from "./Link";
import Icon from "./Icon";
import ViewMoreLink from "./ViewMoreLink";
import { ChevronLeft } from "react-feather";
import type { NewBlogPost } from "../blog-posts";

type Props = {
  meta: NewBlogPost,
  children: React$Node
};

const EmailInput = styled.input.attrs({
  type: "email"
})`
  font-size: 1em;
  border-radius: 3px;
  width: 100%;
  border: 1px solid ${props => props.theme.colors.greys[2]};
  padding: 0.5em;
`;

const NewsletterForm = () => (
  <form
    action="https://buttondown.email/api/emails/embed-subscribe/mxstbr"
    method="post"
    target="popupwindow"
    onsubmit="window.open('https://buttondown.email/mxstbr', 'popupwindow')"
    class="embeddable-buttondown-form"
  >
    <EmailInput name="email" id="bd-email" placeholder="contact@mxstbr.com" />
    <input type="hidden" value="1" name="embed" />
    <Button as="input" type="submit" value="Subscribe" />
  </form>
);

export default ({ meta, children }: Props) => (
  <>
    <PageHeader
      title={meta.title}
      description={meta.summary}
      image={meta.image}
    />
    {children}
    <hr />
    <H3 css="margin-top: 0;">Subscribe to the newsletter</H3>
    <Paragraph>Be the first to know when I post something new!</Paragraph>
    <NewsletterForm />
    <hr />
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
