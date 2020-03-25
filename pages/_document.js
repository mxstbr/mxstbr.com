import Document, { Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

// $FlowIssue
export default class MyDocument extends Document {
  // $FlowIssue
  static getInitialProps({ renderPage }) {
    const sheet = new ServerStyleSheet();
    const page = renderPage(App => props =>
      sheet.collectStyles(<App {...props} />)
    );
    const styleTags = sheet.getStyleElement();
    return { ...page, styleTags };
  }

  render() {
    return (
      <html lang="en">
        <Head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, minimum-scale=1.0"
          />
          <link
            rel="alternate"
            type="application/rss+xml"
            title="RSS"
            href="https://mxstbr.com/rss"
          />
          {this.props.styleTags}
        </Head>
        <body className="no-js">
          <script
            dangerouslySetInnerHTML={{
              __html: `document.body.classList.remove('no-js');`
            }}
          />
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
