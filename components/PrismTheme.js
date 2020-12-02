import { createGlobalStyle } from "styled-components";
// $FlowIssue
import "prismjs/themes/prism.css";

export default createGlobalStyle`

  .token {
    background: none!important;
  }

  pre,
  pre code {
    margin: 0!important;
    margin-bottom: 16px!important;
  }
`;
