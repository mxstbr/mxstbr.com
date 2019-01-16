import React from "react";
import { Zap } from "react-feather";
import Icon from "./Icon";
import Card from "./Card";

type Props = {
  title: string,
  body: string
};

export default (props: Props) => (
  <Card hover={false} mb={3}>
    <Card.Title>
      <Icon ml={0} mr={1}>
        <Zap size="1em" />
      </Icon>
      {props.title}
    </Card.Title>
    <Card.Body color="#333">{props.body}</Card.Body>
  </Card>
);
