import React from "react";
import { loadWebMentionCounts } from "./utils";
import type { WebMentionCounts } from "./types";

type State = {
  loading: boolean,
  error: ?string,
  data: ?WebMentionCounts
};

type Props = {
  children: State => React$Node,
  path: string
};

export default class FetchWebMentionCounts extends React.Component<
  Props,
  State
> {
  state = {
    loading: false,
    error: null,
    data: null
  };

  componentDidMount() {
    this.setState({
      loading: true
    });
    loadWebMentionCounts(`https://mxstbr.com${this.props.path}/`)
      .then(data => {
        this.setState({
          loading: false,
          data
        });
      })
      .catch(err => {
        this.setState({
          loading: false,
          error: "Failed to load web mention counts."
        });
      });
  }

  render() {
    return this.props.children(this.state);
  }
}
