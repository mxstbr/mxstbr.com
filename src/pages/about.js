import React from "react";
import { Mail } from "react-feather";
import { StaticImage } from "gatsby-plugin-image";
import Icon from "../../components/Icon";
import PageHeader from "../../components/PageHeader";
import Paragraph from "../../components/Paragraph";
import Blockquote, { Cite } from "../../components/Blockquote";
import Head from "../../components/Head";
import Link from "../../components/Link";
import Text from "../../components/Text";
import { H3 } from "../../components/Heading";
import { TextButton } from "../../components/Button";

export default () => (
  <>
    <PageHeader title="About Me" mb={0}>
      <Head
        title="About Me – Max Stoiber (@mxstbr)"
        description="Who is Max Stoiber? "
      />
    </PageHeader>

    <Paragraph>
      <StaticImage
        src="../me.jpg"
        alt="Max standing in a garden"
        style={{ width: `100%`, borderRadius: `5px` }}
        imgStyle={{ width: `100%`, borderRadius: `5px` }}
      />
    </Paragraph>
    <Paragraph>👋 I'm a JavaScript engineer from Vienna, Austria. </Paragraph>
  </>
);
