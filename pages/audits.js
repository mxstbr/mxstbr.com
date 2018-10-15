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
    <PageHeader title="Remote Codebase Audits by a React expert" mb={0}>
      <Paragraph centered>
        I'm available for hire for remote codebase audits of React applications.
        I do a deep dive into your production codebase and compile a report full
        of recommendations designed to{" "}
        <strong>
          speed up day-to-day development for years to come by empowering your
          team to move faster than ever before!
        </strong>
      </Paragraph>
      <Head
        title="Remote Codebase Audits – Max Stoiber (@mxstbr)"
        description="Remote codebase audits for your React application. Improve the way you and your team work!"
      />
    </PageHeader>
    <Blockquote>
      “Max helped us to clarify the main obstacles in our codebase, gave us a
      lot of useful advice about testing & development and already saved us a
      lot of time. I can't recommend him highly enough!”
      <Cite>Martin Machycek, Frontend Lead at Easygo Gaming</Cite>
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
      <strong>I'm an expert and community leader in the React ecosystem</strong>{" "}
      and have created some of the most popular React open source packages and
      repositories, like{" "}
      <Link href="https://github.com/react-boilerplate/react-boilerplate">
        react-boilerplate
      </Link>
      , one of the biggest React starter kits with almost 20,000 stars on
      GitHub, and{" "}
      <Link href="https://github.com/styled-components/styled-components">
        styled-components
      </Link>
      , an effort to package some distilled best practices into a reusable
      styling library with 19,000 stars on GitHub.{" "}
      <strong>
        Development teams at Bloomberg, Reddit, Atlassian, Coinbase, Patreon and
        hundreds of other companies rely on my work to power their React apps.
      </strong>
    </Paragraph>
    <Paragraph>
      Now you can{" "}
      <strong>
        hire me to bring my expertise to your production codebase!
      </strong>{" "}
      Boost your teams day-to-day agility and get your product moving faster
      than ever before!
    </Paragraph>
    <TextButton as={Link} href="mailto:contact@mxstbr.com">
      <Text fontSize={2}>
        Email contact@mxstbr.com
        <Icon>
          <Mail size="1em" />
        </Icon>
      </Text>
    </TextButton>
    <H3 mb={2} mt={4}>
      How it works
    </H3>
    <Paragraph>My audits take on a specific form:</Paragraph>
    <Paragraph>
      1. You give me access to your codebase and I spend a day deeply
      investigating and auditing it
    </Paragraph>
    <Paragraph>
      2. I compile a report full of recommendations tailored to your codebase,
      team and business goals, designed to speed up day-to-day development for
      years to come by confining technical debt, implementing specialised tools
      and much more
    </Paragraph>
    <Paragraph>
      3. After your team has digested the report we do an hour long call about
      the recommendations and to answer any questions they may have
    </Paragraph>

    <Paragraph>
      These code audits have a fixed price of 2,000€ (+ 20% VAT), with a 50%
      downpayment upfront. If you have any questions or want to schedule an
      audit please reach out!
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
