export type OpenSourceProject = {
  repo: string,
  name: string,
  description: string,
  stars: number,
  background?: string,
  featured?: boolean,
  active?: boolean
};

const projects: Array<OpenSourceProject> = [
  {
    repo: "withspectrum/spectrum",
    name: "Spectrum",
    description:
      "The community platform for the future. Grow safe, successful online communities that are built to last.",
    stars: 7726,
    background: "linear-gradient(to top right, #7213FB, #4F16EE)",
    featured: true
  },
  {
    repo: "styled-components/styled-components",
    name: "styled-components",
    description:
      "Visual primitives for the component age. Use the best bits of ES6 and CSS to style your apps without stress",
    stars: 26556,
    background: "linear-gradient(to top right, #DB7093, #DAA357)",
    featured: true
  },
  {
    repo: "react-boilerplate/react-boilerplate",
    name: "react-boilerplate",
    description:
      "A foundation for React apps with a focus on scalability, developer experience and best practices.",
    stars: 23927,
    background: "linear-gradient(to bottom right, #6D6E72, #9EA0A6)",
    featured: true
  },
  {
    repo: "styled-components/polished",
    name: "Polished",
    description:
      'A lightweight toolset for writing styles in JavaScript, the "Lodash of CSS-in-JS"',
    stars: 5537,
    featured: true
  },
  {
    repo: "mxstbr/sharingbuttons.io",
    name: "sharingbuttons.io",
    description:
      "Quickly generate social media sharing buttons that don't track your users.",
    stars: 2156,
    featured: true
  },
  {
    repo: "mxstbr/login-flow",
    name: "Login Flow",
    stars: 1527,
    description:
      "An example React and Redux implementation of a login/register flow.",
    featured: true
  },
  {
    repo: "mxstbr/micro-github",
    stars: 581,
    description:
      "A tiny microservice to easily add authentication with GitHub to your application."
  },
  {
    repo: "mxstbr/postcss.parts",
    name: "PostCSS.parts",
    stars: 43,
    description: "A searchable catalog of of PostCSS plugins."
  },
  {
    repo: "mxstbr/dotfiles",
    stars: 17,
    description: "My dotfiles"
  },
  {
    repo: "mxstbr/create-vcard",
    stars: 11,
    description: "Create vCard strings from key-value objects."
  },
  {
    repo: "mxstbr/teapot",
    stars: 5,
    description: 'A teapot server written in Go. "418 I\'m a teapot"'
  },
  {
    repo: "mxstbr/cyclejs-counter",
    stars: 2,
    description: "A counter app written with Cycle.JS and TypeScript."
  },
  {
    repo: "withspectrum/micro-open-graph",
    stars: 267,
    description:
      "A tiny Node.js microservice to scrape open graph data with joy."
  },
  {
    repo: "withspectrum/react-app-rewire-styled-components",
    stars: 120,
    description:
      "Add the styled-components Babel plugin to your create-react-app app via react-app-rewired."
  },
  {
    repo: "withspectrum/callback-to-async-iterator",
    stars: 52,
    description: "Turn any callback-based listener into an async iterator."
  },
  {
    repo: "withspectrum/graphql-log",
    stars: 45,
    description:
      "Add logging to your GraphQL resolvers so you know what's going on in your app."
  },
  {
    repo: "withspectrum/redis-tag-cache",
    stars: 31,
    description: "Cache and invalidate records in Redis with tags"
  },
  {
    repo: "withspectrum/danger-plugin-no-console",
    stars: 30,
    description:
      "DangerJS plugin to prevent merging any code that contains console log statements"
  },
  {
    repo: "withspectrum/draft-js-prism-plugin",
    stars: 23,
    description: "Add syntax highlighting support to your DraftJS editor"
  },
  {
    repo: "withspectrum/draft-js-code-editor-plugin",
    stars: 21,
    description:
      "Add IDE-like behaviours to code blocks in your DraftJS editors"
  },
  {
    repo: "withspectrum/danger-plugin-flow",
    stars: 20,
    description: "Ensure all JS files that get touched in a PR are flow typed"
  },
  {
    repo: "withspectrum/npm-pkg",
    stars: 19,
    description: "Create your npm package with ESNext, Flowtype and prettier."
  },
  {
    repo: "withspectrum/danger-plugin-labels",
    stars: 16,
    description: "Let any contributor add labels to their PRs and issues"
  },
  {
    repo: "withspectrum/micro-code-analyser",
    stars: 13,
    description:
      "A tiny Node.js microservice to detect the language of a code snippet"
  },
  {
    repo: "withspectrum/jscodeshift-graphql-files",
    stars: 11,
    description:
      "Transform .js files with GraphQL template literals into .graphql files"
  },
  {
    repo: "withspectrum/rethinkdb-inspector",
    stars: 10,
    description:
      "️Inspect your RethinkDB queries to find out how fast they are."
  },
  {
    repo: "withspectrum/micro-redirect",
    stars: 10,
    description:
      "A tiny Node.js microservice to redirect users to a different location."
  },
  {
    repo: "withspectrum/markdown-linkify",
    stars: 7,
    description:
      "Turn plain URLs in text into Markdown links. Works in the browser and on the server."
  },
  {
    repo: "styled-components/babel-plugin-styled-components",
    stars: 443,
    description:
      "Improve the debugging experience and add server-side rendering support to styled-components"
  },
  {
    repo: "styled-components/stylelint-processor-styled-components",
    stars: 409,
    description: "Lint your styled components with stylelint!"
  },
  {
    repo: "styled-components/styled-components-website",
    stars: 179,
    description: "The styled-components website, styled-components.com"
  },
  {
    repo: "styled-components/color-schemer",
    stars: 31,
    description:
      "A demo app for polished, get an entire color scheme from a single color."
  },
  {
    repo: "styled-components/stylelint-config-styled-components",
    stars: 27,
    description:
      "The shareable stylelint config for stylelint-processor-styled-components"
  },
  {
    repo: "styled-components/styled-components-codemods",
    stars: 21,
    description:
      "Automatic codemods to upgrade your styled-components code to newer versions."
  },
  {
    repo: "keystonejs/keystone",
    name: "KeystoneJS",
    stars: 13446,
    description: "Node.js CMS and web application framework",
    active: false
  },
  {
    repo: "carteb/carte-blanche",
    name: "Carte Blanche",
    stars: 1523,
    description:
      "An isolated development space with integrated fuzz testing for your React components.",
    active: false
  },
  {
    repo: "draft-js-plugins/draft-js-plugins",
    name: "DraftJS Plugins",
    stars: 2896,
    description: "High quality plugins with great UX on top of DraftJS."
  },
  {
    repo: "postcss/postcss.org",
    stars: 66,
    description: "The PostCSS website.",
    active: false
  },
  {
    repo: "mxstbr/mxstbr.com",
    stars: 11,
    description: "This very website's source code!"
  }
].map(p => {
  if (p.name) return p;

  return {
    ...p,
    name: p.repo.split("/")[1]
  };
});

export default projects;
