import React from "react";
import Head from "next/head";
import { withRouter, type Router } from "next/router";
import JsonLD, { type JsonLD as JsonLDType } from "./JsonLD";

type Props = {
  title?: string,
  description?: string,
  image?: string,
  jsonld?: JsonLDType | Array<JsonLDType>,
  router: Router,
  children?: React$Node
};

export default withRouter(
  ({ title, description, image, router, jsonld, children }: Props) => (
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
      <link
        rel="alternate"
        title="Max Stoibers (@mxstbr) Thoughts — Feed"
        type="application/json"
        href="https://mxstbr.com/feed.json"
      />

      {/* OPEN GRAPH */}
      <meta property="og:type" key="og:type" content="website" />
      <meta
        property="og:url"
        key="og:url"
        content={`https://mxstbr.com${router.pathname}`}
      />
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
        <meta
          property="og:image"
          key="og:image"
          content={`https://mxstbr.com${image}`}
        />
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
        <meta
          name="twitter:image"
          key="twitter:image"
          content={`https://mxstbr.com${image}`}
        />
      )}
      <JsonLD
        data={[
          {
            "@context": "http://schema.org",
            "@type": "Person",
            id: "mxstbr",
            email: "mailto:contact@mxstbr.com",
            image: "/static/images/headshot.jpeg",
            jobTitle: "Senior Software Engineer",
            familyName: "Stoiber",
            givenName: "Max",
            name: "Max Stoiber",
            birthPlace: "Vienna, Austria",
            birthDate: "1997-01-04",
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
          },
          ...(Array.isArray(jsonld) ? jsonld : [jsonld])
        ].filter(Boolean)}
      />
      <link
        rel="webmention"
        href="https://webmention.io/mxstbr.com/webmention"
      />
      <link rel="pingback" href="https://webmention.io/mxstbr.com/xmlrpc" />
      {children}
    </Head>
  )
);
