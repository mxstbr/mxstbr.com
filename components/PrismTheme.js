import { createGlobalStyle } from "styled-components";
// $FlowIssue
import defaultTheme from "prismjs/themes/prism.css";

export default createGlobalStyle`
  ${defaultTheme}

  .token {
    background: none!important;
  }

  pre,
  pre code {
    line-height: 1.3;
  }
`;
