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
    <PageHeader title="Uses" mb={0}>
      <Paragraph centered>
        Make sure to check out <Link href="https://uses.tech">uses.tech</Link>{" "}
        for a list of everyone's /uses pages!
      </Paragraph>
      <Head
        title="Uses"
        description="All the tools, gear and other stuff I use on a daily basis"
      />
    </PageHeader>
    {/* <H3 mb={2} mt={4}>
      
    </H3> */}
    <Paragraph>
      <ul>
        <li>Visual Studio Code</li>
        <li>The stock Terminal.app</li>
        <li>13" MacBook Pro, 2020</li>
        <li>MonoLisa font</li>
        <li>The Brave browser</li>
        <li>Bear for note taking</li>
        <li>Lungo for keeping my Mac awake</li>
        <li>Vanilla for the neat menubar</li>
        <li>LG 34UC99-W widescreen monitor</li>
        <li>IKEA Bekant standing desk</li>
        <li>Ergodox EZ keyboard</li>
        <li>Logitech Vertical MX mouse</li>
        <li>Steelcase Gesture chair</li>
        <li>Minaal Backpack</li>
        <li>
          Shure Beta 87A microphone connected to a TASCAM US-2x2 USB interface
        </li>
      </ul>
    </Paragraph>
  </>
);
