import React from "react";
import { Mail } from "react-feather";
import { StaticImage } from "gatsby-plugin-image";
import Icon from "../../components/Icon";
import PageHeader from "../../components/PageHeader";
import WideSection from "../../components/WideSection";
import { H2 } from "../../components/Heading";
import Paragraph from "../../components/Paragraph";
import Blockquote, { Cite } from "../../components/Blockquote";
import Head from "../../components/Head";
import Link from "../../components/Link";
import Text from "../../components/Text";
import { H3 } from "../../components/Heading";
import { TextButton } from "../../components/Button";

export default () => (
  <>
    <PageHeader title="" mb={0}>
      <Head
        title="About Me – Max Stoiber (@mxstbr)"
        description="Who is Max Stoiber? "
      />
    </PageHeader>

    <WideSection>
      <StaticImage
        src="../me.jpg"
        alt="Max standing in a garden"
        layout="fluid"
        maxWidth="100%"
        imgStyle={{ borderRadius: `5px` }}
        style={{ borderRadius: `5px` }}
      />
    </WideSection>

    <H2>About me</H2>

    <Paragraph>
      Hey, I'm Max! I currently work at{" "}
      <Link href="https://gatsbyjs.com">Gatsby</Link>, making it easier to build
      websites with React. Before that I was at{" "}
      <Link href="https://github.com">GitHub</Link>, architecting a greenfield
      React app, who acquired my startup{" "}
      <Link href="https://spectrum.chat">Spectrum</Link> in Nov
    </Paragraph>

    <Paragraph>
      I was born and raised in a small town just outside of Vienna, Austria
      called Mödling. After graduating from the{" "}
      <Link href="https://en.wikipedia.org/wiki/Sir-Karl-Popper-Schule">
        Sir Karl Popper high school
      </Link>{" "}
      I tried
    </Paragraph>
  </>
);
