import React from "react";
import Head from "next/head";
import JsonLD from "./JsonLD";

type Props = {
  title?: string,
  description?: string,
  image?: string
};

export default ({ title, description, image }: Props) => (
  <Head>
    {/* DEFAULT */}

    {title != undefined && <title key="title">{title}</title>}
    {description != undefined && (
      <meta name="description" key="description" content={description} />
    )}
    <link
      rel="icon"
      type="image/x-icon"
      href="/static/images/favicon_new.png"
    />
    <link rel="apple-touch-icon" href="/static/images/favicon_new.png" />

    {/* OPEN GRAPH */}
    {title != undefined && (
      <meta property="og:title" content={title} key="og:title" />
    )}
    {description != undefined && (
      <meta
        property="og:description"
        key="og:description"
        content={description}
      />
    )}
    {image != undefined && (
      <meta property="og:image" key="og:image" content={image} />
    )}

    {/* TWITTER */}
    <meta
      name="twitter:card"
      key="twitter:card"
      content="summary_large_image"
    />
    <meta name="twitter:site" key="twitter:site" content="@mxstbr" />
    <meta name="twitter:creator" key="twitter:creator" content="@mxstbr" />
    {title != undefined && (
      <meta name="twitter:title" key="twitter:title" content={title} />
    )}
    {description != undefined && (
      <meta
        name="twitter:description"
        key="twitter:description"
        content={description}
      />
    )}
    {image != undefined && (
      <meta name="twitter:image" key="twitter:image" content={image} />
    )}
    <JsonLD
      data={{
        "@context": "http://schema.org",
        "@type": "Person",
        email: "mailto:contact@mxstbr.com",
        image: "/static/images/headshot.jpeg",
        jobTitle: "Senior Software Engineer",
        familyName: "Stoiber",
        givenName: "Max",
        birthPlace: "Vienna, Austria",
        birthDate: "1997.01.04",
        height: "185 cm",
        gender: "male",
        nationality: "Austria",
        url: "https://mxstbr.com",
        sameAs: [
          "https://mxstbr.blog",
          "https://www.facebook.com/mxstbr",
          "https://www.linkedin.com/in/max-stoiber-46698678",
          "http://twitter.com/mxstbr",
          "http://instagram.com/mxstbr"
        ]
      }}
    />
  </Head>
);
