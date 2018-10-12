import React from "react";
import { Flex } from "rebass";
import AppearancesList from "../components/AppearancesList";
import { H2 } from "../components/Heading";
import Head from "../components/Head";
import Paragraph from "../components/Paragraph";
import SmallLayout from "../components/SmallLayout";
import PageHeader from "../components/PageHeader";

import appearances from "../appearances";

export default () => (
  <>
    <PageHeader>
      <H2 alignSelf="center" mt={[4, 5]}>
        My Appearances
      </H2>
      <Paragraph centered>
        These are all the talks I've given, podcasts I've recorded, awards I've
        gotten, meetups I've spoken at and interviews I've been a part of of the
        past couple years.
      </Paragraph>
    </PageHeader>
    <SmallLayout m="0 auto">
      <Head
        title="My Appearances - Max Stoiber (@mxstbr)"
        description="All my talks, podcasts, awards and interviews of the past couple years in one place."
      />
      <AppearancesList appearances={appearances} />
    </SmallLayout>
  </>
);
