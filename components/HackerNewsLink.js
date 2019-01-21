import React from "react";
import fetch from "isomorphic-unfetch";

type State = {
  href: string
};

type Props = {
  title: string,
  path: string,
  children: State => React$Node
};

export default class HackerNewsLink extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { path, title } = this.props;
    this.state = {
      href: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
        `https://mxstbr.com${path}/`
      )}&t=${encodeURIComponent(title)}`
    };
  }

  componentDidMount() {
    fetch(
      `http://hn.algolia.com/api/v1/search?tags=story&restrictSearchableAttributes=url&query=${encodeURIComponent(
        `https://mxstbr.com${this.props.path}/`
      )}`
    )
      .then(res => res.json())
      .then(res => {
        if (!res || !Array.isArray(res.hits) || res.hits.length === 0) return;
        const beloved = res.hits.reduce((a, b) => {
          if (a.points > b.points) return a;
          return b;
        }, res.hits[0]);
        this.setState({
          href: `https://news.ycombinator.com/item?id=${beloved.objectID}`
        });
      })
      .catch(err => {
        console.error(err);
      });
  }

  render() {
    return this.props.children(this.state);
  }
}
