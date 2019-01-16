import React from "react";
import Paragraph from "./Paragraph";
import Card from "./Card";
import { Award } from "react-feather";
import { Box } from "rebass";

type Props = {
  title: string,
  body: string,
  first?: boolean,
  last?: boolean
};

export default (props: Props) => (
  <Card hover={false} my={4}>
    <Paragraph mb={0} py={4} px={4}>
      <strong>{props.title}</strong>: {props.body}
    </Paragraph>
    <Box
      css={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        // justifyContent: "flex-end",
        alignItems: "center"
      }}
    >
      <Box ml="-30px" color="background">
        <Award size="200px" />
      </Box>
    </Box>
  </Card>
);
