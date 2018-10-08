import React from 'react'
import App, { Container } from 'next/app'
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import reset from 'styled-reset';
import Layout from '../components/Layout';

const theme = {
  fonts: {
    system: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'],
  }
};

const GlobalStyle = createGlobalStyle`
  ${reset}
`

export default class MyApp extends App {
  render () {
    const {Component, pageProps} = this.props
    return (
      <Container>
        <ThemeProvider theme={theme}>
          <Layout>
            <GlobalStyle />
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </Container>
    )
  }
}
