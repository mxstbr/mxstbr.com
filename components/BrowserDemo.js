import React from "react";
import styled from "styled-components";

const Browser = styled.div`
  padding: 18px 0em;
  border: 1px solid #eee;
  border-radius: 3px;
  margin: 16px 0;
  padding-top: 0;
`;

const BrowserBar = styled.div`
  height: 20px;
  width: 100%;
  border-radius: 3px 3px 0 0;
  background-color: #eee;
  margin-bottom: 16px;
  position: relative;
`;

const TrafficLights = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 100%;
  background-color: #fdbd41;
  position: absolute;
  top: 5px;
  left: 20px;

  &:before {
    content: "";
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: #fc605b;
    position: absolute;
    top: 0;
    left: -15px;
  }

  &:after {
    content: "";
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: #33c748;
    position: absolute;
    top: 0;
    left: 15px;
  }
`;

const BrowserContent = styled.div`
  width: 100%;
  padding: 0 1em;
  margin: 0;
`;

type Props = {
  html: string,
  children?: React$Node
};

export default ({ html, children }: Props) => (
  <Browser>
    <BrowserBar>
      <TrafficLights />
    </BrowserBar>
    <BrowserContent dangerouslySetInnerHTML={{ __html: html }}>
      {children}
    </BrowserContent>
  </Browser>
);
