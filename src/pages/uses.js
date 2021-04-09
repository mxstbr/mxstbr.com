import React from "react";
import { Mail } from "react-feather";
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
      <ul style={{ listStyle: `disc`, paddingLeft: `1em` }}>
        <li>13" MacBook Pro, 2020</li>
        <li>LG 34UC99-W widescreen monitor</li>
        <li>IKEA Bekant standing desk</li>
        <li>Steelcase Gesture chair</li>
        <li>Logitech Vertical MX mouse</li>
        <li>Ergodox EZ keyboard</li>
        <li>Shure Beta 87A microphone</li>
        <li>AirPods Pro / Bose QC20</li>
        <li>TASCAM US-2x2 USB audio interface</li>
        <li>Elgato CamLink</li>
        <li>Fuji X100F (webcam)</li>
        <li>Elgato KeyLight</li>
        <li>Raycast.app</li>
        <li>Visual Studio Code</li>
        <li>Terminal.app with Fig</li>
        <li>Todoist</li>
        <li>Lungo</li>
        <li>ColorSnapper</li>
        <li>MonoLisa font</li>
        <li>Brave browser</li>
      </ul>
    </Paragraph>
  </>
);
