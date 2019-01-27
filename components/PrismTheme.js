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
    margin: 0!important;
    margin-bottom: 16px!important;
  }
`;
