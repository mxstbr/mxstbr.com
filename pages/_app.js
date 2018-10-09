import React from "react";
import App, { Container } from "next/app";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import reset from "styled-reset";
import { Box } from "rebass";
import Layout from "../components/Layout";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const theme = {
  fonts: {
    system: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Segoe UI Symbol"
    ],
    serif: ["Georgia", "serif"]
  }
};

const GlobalStyle = createGlobalStyle`
  ${reset}

  body {
    background-color: rgb(246, 247, 248);
    margin: 0;
  }
`;

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <Container>
        <ThemeProvider theme={theme}>
          <>
            <Nav />
            <title>Max Stoiber (@mxstbr)</title>
            <Layout css={{ paddingTop: "106px" }}>
              <GlobalStyle />
              <Component {...pageProps} />
            </Layout>
            <Footer />
          </>
        </ThemeProvider>
      </Container>
    );
  }
}
