import React from "react";
import { loadWebMentions } from "./utils";
import type { WebMention } from "./types";

type State = {
  loading: boolean,
  error: ?string,
  data: ?Array<WebMention>,
  page: number,
  hasNextPage: boolean
};

type Props = {
  children: ({
    ...State,
    loadNextPage: () => Promise<void>
  }) => React$Node,
  path: string
};

export default class FetchWebMentionResponses extends React.Component<
  Props,
  State
> {
  state = {
    loading: false,
    error: null,
    data: null,
    page: -1,
    hasNextPage: true
  };

  componentDidMount() {
    this.loadNextPage();
  }

  loadNextPage = () => {
    const { page } = this.state;
    return this.loadPage(page + 1).then(res => {
      return res;
    });
  };

  loadPage = async (page: number) => {
    if (!this.state.hasNextPage) return;
    const url = `https://mxstbr.com${this.props.path}/`;
    this.setState({
      loading: true,
      page
    });
    try {
      const mentions = await loadWebMentions(url, page);
      this.setState(prev => ({
        data: [...(prev.data || []), ...(mentions || [])],
        loading: false,
        hasNextPage: mentions.length !== 0
      }));
    } catch (err) {
      this.setState({
        loading: false,
        error: "Failed to load."
      });
    }
  };

  render() {
    return this.props.children({
      ...this.state,
      loadNextPage: this.loadNextPage
    });
  }
}
