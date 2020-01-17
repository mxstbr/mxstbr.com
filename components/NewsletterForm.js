import React from "react";
import styled from "styled-components";
import { Box, Flex } from "rebass";
import Button from "./Button";
import Card from "./Card";
import Icon from "./Icon";
import { Send } from "react-feather";
import type { RebassProps } from "rebass";

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
    mx={[3, 4]}
    pb={[3, 4]}
    mt={2}
    as="form"
    action="https://buttondown.email/api/emails/embed-subscribe/mxstbr"
    method="post"
    target="popupwindow"
    onsubmit="window.open('https://buttondown.email/mxstbr', 'popupwindow')"
    alignItems="center"
    flexWrap="wrap"
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

export const NewsletterUpsellCard = (props: RebassProps) => (
  <Card hover={false} my={4} {...props}>
    <Card.Title css="margin-top: 0;">
      Subscribe to the newsletter{" "}
      <Icon>
        <Send color="#666" size="1em" />
      </Icon>
    </Card.Title>
    {/* $FlowIssue */}
    <Card.Body mb={2}>
      Be the first to know when I post something new! Candid thoughts about
      React.js, Node.js, startups and other interesting things.
    </Card.Body>
    <NewsletterForm />
  </Card>
);

export default NewsletterForm;
