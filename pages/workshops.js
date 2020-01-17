import { Mail } from "react-feather";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import Paragraph from "../components/Paragraph";
import Blockquote, { Cite } from "../components/Blockquote";
import Head from "../components/Head";
import Link from "../components/Link";
import Text from "../components/Text";
import { H3 } from "../components/Heading";
import { TextButton } from "../components/Button";

export default () => (
  <>
    <PageHeader title="React Workshops" mb={0}>
      <Paragraph centered />
      <Head title="React Workshops – Max Stoiber (@mxstbr)" description="" />
    </PageHeader>
    <Blockquote>
      “I really liked the workshop. It was worth going from Portugal to Berlin
      just for this.”
      <Cite>Attendee of the Modern React workshop</Cite>
    </Blockquote>
    <TextButton mt={3} as={Link} href="mailto:contact@mxstbr.com">
      <Text fontSize={2}>
        Email contact@mxstbr.com
        <Icon>
          <Mail size="1em" />
        </Icon>
      </Text>
    </TextButton>
    <H3 mb={2} mt={4}>
      Why should you hire me?
    </H3>
    <Paragraph>
      <strong>I'm an expert and community leader in the React ecosystem</strong>
      . I have created some of the most popular React open source packages and
      repositories:
      <ul>
        <li>
          <Link href="https://github.com/react-boilerplate/react-boilerplate">
            react-boilerplate
          </Link>
          , one of the biggest React starter kits with more than 24,000 stars on
          GitHub
        </li>
      </ul>
      , and{" "}
      <Link href="https://github.com/styled-components/styled-components">
        styled-components
      </Link>
      , an effort to package some distilled best practices into a reusable
      styling library with 27,000 stars on GitHub.{" "}
      <strong>
        Development teams at Bloomberg, Reddit, Atlassian, Coinbase, Patreon and
        hundreds of other companies rely on my work to power their React apps.
      </strong>
    </Paragraph>
    <Paragraph>
      Now you can{" "}
      <strong>hire me to train your team in modern React techniques!</strong>{" "}
    </Paragraph>
    <TextButton as={Link} href="mailto:contact@mxstbr.com">
      <Text fontSize={2}>
        Email contact@mxstbr.com
        <Icon>
          <Mail size="1em" />
        </Icon>
      </Text>
    </TextButton>
  </>
);
