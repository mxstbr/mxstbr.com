// From: https://blog.haroen.me/json-ld-with-react
import React from "react";

export type JsonLD = {
  [key: string]: string | Array<string>
};

type Props = {
  data: JsonLD | Array<JsonLD>
};

const JsonLd = ({ data }: Props) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default JsonLd;
