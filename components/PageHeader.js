import React from "react";
import { Flex, type RebassProps } from "rebass";
import Head from "./Head";
import SmallLayout from "./SmallLayout";
import { H2 } from "./Heading";

type Props = {
  ...$Exact<RebassProps>,
  children: React$Node,
  title: string,
  image?: string
};

export default (props: Props) => (
  <Flex
    flexDirection="column"
    width={1}
    mb={props.children ? 4 : 3}
    mt={[4, 5]}
    justifyContent="center"
    {...{ ...props, title: undefined }}
  >
    <Head title={props.title} image={props.image} />
    <H2 alignSelf="center" textAlign="center" mt={0}>
      {props.title}
    </H2>
    {props.children}
  </Flex>
);
