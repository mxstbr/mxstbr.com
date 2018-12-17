import React from "react";
import Router from "next/router";

export default class extends React.Component<{}> {
  // $FlowIssue
  static async getInitialProps({ res }) {
    if (res) {
      res.writeHead(302, {
        Location: "https://mxstbr.com/static/images/headshot.jpeg"
      });
      res.end();
    } else {
      Router.push("https://mxstbr.com/static/images/headshot.jpeg");
    }
    return {};
  }
}
