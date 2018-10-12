// From: https://blog.haroen.me/json-ld-with-react
import React from "react";

type Props = {
  data: {
    [key: string]: string | Array<string>
  }
};

const JsonLd = ({ data }: Props) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default JsonLd;
