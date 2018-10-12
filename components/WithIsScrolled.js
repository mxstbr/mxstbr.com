// Taken from the styled-components website
// @see https://github.com/styled-components/styled-components-website/blob/a9418dd2d6843e1f0efdb0a6869a954a79bf088b/components/WithIsScrolled.js
import { Component } from "react";

type State = {
  isScrolled: boolean
};

type Props = {
  children: State => React$Node
};

class WithIsScrolled extends Component<Props, State> {
  state = {
    isScrolled: false
  };

  componentDidMount() {
    // Learn more about how { passive: true } improves scrolling performance
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.onScroll, { passive: true });
  }

  onScroll = () => {
    const scrollTop = document.body != undefined ? document.body.scrollTop : 0;
    const isScrolled = (window.pageYOffset || scrollTop) > 0;

    if (isScrolled !== this.state.isScrolled) {
      this.setState({ isScrolled });
    }
  };

  render() {
    return this.props.children(this.state);
  }
}

export default WithIsScrolled;
