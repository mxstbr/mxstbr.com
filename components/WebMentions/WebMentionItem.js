import React from "react";
import { Flex, Box, Image } from "rebass";
import { Twitter } from "react-feather";
import { parse, format } from "date-fns";
import Icon from "../Icon";
import Link from "../Link";
import Paragraph from "../Paragraph";
import Text from "../Text";
import type { WebMention } from "./types";

const handleLineBreaks = (text: string) =>
  text
    .replace(/\n+/g, "\n")
    .split("\n")
    .map((item, key) => (
      <React.Fragment key={key}>
        {item}
        <br />
      </React.Fragment>
    ));

export default ({ mention }: { mention: WebMention }) => (
  <Flex flexDirection="row" my={3}>
    <Box width={40} mr={3} flex="0 0 auto">
      <Link href={mention.url}>
        <Image
          width={40}
          height={40}
          css={{ borderRadius: "50%" }}
          alt={`avatar of ${mention.author.name}`}
          src={mention.author.photo}
        />
      </Link>
    </Box>
    <Box>
      <Link href={mention.url}>
        <Text fontWeight="bold" as="div" mb={1} mr={2}>
          {mention.author.name}
          <Box as="span" color="tertiary" css={{ fontWeight: "normal" }}>
            {" · "}
            {format(
              parse(
                typeof mention.published === "string"
                  ? mention.published
                  : mention["wm-received"]
              ),
              "DD MMM, YYYY [at] H:m"
            )}
          </Box>
        </Text>
      </Link>
      {mention.content && (
        <Paragraph color="tertiary" fontSize={2}>
          {handleLineBreaks(mention.content.text)}
        </Paragraph>
      )}
    </Box>
  </Flex>
);
