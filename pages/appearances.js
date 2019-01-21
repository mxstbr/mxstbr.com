import React from "react";
import { Flex } from "rebass";
import { Radio, Mic, Terminal, Award, Film, Zap } from "react-feather";
import AppearancesList from "../components/AppearancesList";
import { H2 } from "../components/Heading";
import Head from "../components/Head";
import Paragraph from "../components/Paragraph";
import SmallLayout from "../components/SmallLayout";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";

import appearances from "../data/appearances";

export default () => (
  <>
    <PageHeader title="My Appearances">
      <Paragraph centered>
        These are all the{" "}
        <Zap style={{ verticalAlign: "text-top" }} size="1em" /> lightning &{" "}
        <Film style={{ verticalAlign: "text-top" }} size="1em" /> full-length
        talks I've given,{" "}
        <Mic style={{ verticalAlign: "text-top" }} size="1em" /> podcasts I've
        recorded, <Award style={{ verticalAlign: "text-top" }} size="1em" />{" "}
        awards I've received and{" "}
        <Radio style={{ verticalAlign: "text-top" }} size="1em" /> interviews
        I've been a part of over the past couple years.
      </Paragraph>
    </PageHeader>
    <Head
      title="My Appearances - Max Stoiber @mxstbr)"
      description="All my talks, podcasts, awards and interviews of the past couple years in one place."
    />
    <AppearancesList appearances={appearances} />
  </>
);
