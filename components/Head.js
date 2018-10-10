import React from "react";
import Head from "next/head";

export default ({ title, description, image }) => (
  <Head>
    {/* DEFAULT */}

    {title && <title key="title">{title}</title>}
    {description && (
      <meta name="description" key="description" content={description} />
    )}
    <link
      rel="icon"
      type="image/x-icon"
      href="/static/images/favicon_new.png"
    />
    <link rel="apple-touch-icon" href="/static/images/favicon_new.png" />

    {/* OPEN GRAPH */}
    {title && <meta property="og:title" content={title} key="og:title" />}
    {description && (
      <meta
        property="og:description"
        key="og:description"
        content={description}
      />
    )}
    {image && <meta property="og:image" key="og:image" content={image} />}

    {/* TWITTER */}
    <meta
      name="twitter:card"
      key="twitter:card"
      content="summary_large_image"
    />
    <meta name="twitter:site" key="twitter:site" content="@mxstbr" />
    <meta name="twitter:creator" key="twitter:creator" content="@mxstbr" />
    {title && <meta name="twitter:title" key="twitter:title" content={title} />}
    {description && (
      <meta
        name="twitter:description"
        key="twitter:description"
        content={description}
      />
    )}
    {image && <meta name="twitter:image" key="twitter:image" content={image} />}
  </Head>
);
