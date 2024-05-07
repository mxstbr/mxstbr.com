type OpenSourceProject = {
  repo: string
  name?: string
  description: string
  featured?: boolean
  owner?: boolean
}

const ossProjects: Array<OpenSourceProject> = [
  {
    repo: 'withspectrum/spectrum',
    name: 'Spectrum',
    description:
      'The community platform for the future. Grow safe, successful online communities that are built to last.',
    featured: true,
  },
  {
    repo: 'styled-components/styled-components',
    name: 'styled-components',
    description:
      'Visual primitives for the component age. Use the best bits of ES6 and CSS to style your apps without stress',
    featured: true,
  },
  {
    repo: 'react-boilerplate/react-boilerplate',
    name: 'react-boilerplate',
    description:
      'A foundation for React apps with a focus on scalability, developer experience and best practices.',
    featured: true,
  },

  {
    repo: 'gatsbyjs/gatsby',
    description:
      'A framework based on React that helps developers build blazing fast websites and apps',
    owner: false,
  },
  {
    repo: 'styled-components/polished',
    name: 'Polished',
    description:
      'A lightweight toolset for writing styles in JavaScript, the "Lodash of CSS-in-JS"',
    featured: true,
  },
  {
    repo: 'styled-components/awesome-styled-components',
    name: 'awesome-styled-components',
    description: 'A curated list of awesome styled-components resources',
    featured: true,
  },
  {
    repo: 'mxstbr/sharingbuttons.io',
    name: 'sharingbuttons.io',
    description:
      "Quickly generate social media sharing buttons that don't track your users.",
    featured: true,
  },
  {
    repo: 'mxstbr/login-flow',
    name: 'Login Flow',
    description:
      'An example React and Redux implementation of a login/register flow.',
  },
  {
    repo: 'mxstbr/micro-github',
    description:
      'A tiny microservice to easily add authentication with GitHub to your application.',
  },
  {
    repo: 'mxstbr/postcss.parts',
    name: 'PostCSS.parts',
    description: 'A searchable catalog of of PostCSS plugins.',
  },
  {
    repo: 'mxstbr/dotfiles',
    description: 'My dotfiles',
  },
  {
    repo: 'mxstbr/create-vcard',
    description: 'Create vCard strings from key-value objects.',
  },
  {
    repo: 'mxstbr/teapot',
    description: 'A teapot server written in Go. "418 I\'m a teapot"',
  },
  {
    repo: 'mxstbr/cyclejs-counter',
    description: 'A counter app written with Cycle.JS and TypeScript.',
  },
  {
    repo: 'withspectrum/micro-open-graph',
    description:
      'A tiny Node.js microservice to scrape open graph data with joy.',
  },
  {
    repo: 'withspectrum/react-app-rewire-styled-components',
    description:
      'Add the styled-components Babel plugin to your create-react-app app via react-app-rewired.',
  },
  {
    repo: 'withspectrum/callback-to-async-iterator',
    description: 'Turn any callback-based listener into an async iterator.',
  },
  {
    repo: 'withspectrum/graphql-log',
    description:
      "Add logging to your GraphQL resolvers so you know what's going on in your app.",
  },
  {
    repo: 'withspectrum/redis-tag-cache',
    description: 'Cache and invalidate records in Redis with tags',
  },
  {
    repo: 'withspectrum/danger-plugin-no-console',
    description:
      'DangerJS plugin to prevent merging any code that contains console log statements',
  },
  {
    repo: 'withspectrum/draft-js-prism-plugin',
    description: 'Add syntax highlighting support to your DraftJS editor',
  },
  {
    repo: 'withspectrum/draft-js-code-editor-plugin',
    description:
      'Add IDE-like behaviours to code blocks in your DraftJS editors',
  },
  {
    repo: 'withspectrum/danger-plugin-flow',
    description: 'Ensure all JS files that get touched in a PR are flow typed',
  },
  {
    repo: 'withspectrum/npm-pkg',
    description: 'Create your npm package with ESNext, Flowtype and prettier.',
  },
  {
    repo: 'withspectrum/danger-plugin-labels',
    description: 'Let any contributor add labels to their PRs and issues',
  },
  {
    repo: 'withspectrum/micro-code-analyser',
    description:
      'A tiny Node.js microservice to detect the language of a code snippet',
  },
  {
    repo: 'withspectrum/jscodeshift-graphql-files',
    description:
      'Transform .js files with GraphQL template literals into .graphql files',
  },
  {
    repo: 'withspectrum/rethinkdb-inspector',
    description:
      '️Inspect your RethinkDB queries to find out how fast they are.',
  },
  {
    repo: 'withspectrum/micro-redirect',
    description:
      'A tiny Node.js microservice to redirect users to a different location.',
  },
  {
    repo: 'withspectrum/markdown-linkify',
    description:
      'Turn plain URLs in text into Markdown links. Works in the browser and on the server.',
  },
  {
    repo: 'styled-components/babel-plugin-styled-components',
    description:
      'Improve the debugging experience and add server-side rendering support to styled-components',
  },
  {
    repo: 'styled-components/stylelint-processor-styled-components',
    description: 'Lint your styled components with stylelint!',
  },
  {
    repo: 'styled-components/styled-components-website',
    description: 'The styled-components website, styled-components.com',
  },
  {
    repo: 'styled-components/color-schemer',
    description:
      'A demo app for polished, get an entire color scheme from a single color.',
  },
  {
    repo: 'styled-components/stylelint-config-styled-components',
    description:
      'The shareable stylelint config for stylelint-processor-styled-components',
  },
  {
    repo: 'styled-components/styled-components-codemods',
    description:
      'Automatic codemods to upgrade your styled-components code to newer versions.',
  },
  {
    repo: 'keystonejs/keystone-classic',
    name: 'KeystoneJS',
    description: 'The original Node.js CMS and web application framework',
    owner: false,
  },
  {
    repo: 'carteb/carte-blanche',
    name: 'Carte Blanche',
    description:
      'An isolated development space with integrated fuzz testing for your React components.',
  },
  {
    repo: 'draft-js-plugins/draft-js-plugins',
    name: 'DraftJS Plugins',
    description: 'High quality plugins with great UX on top of DraftJS.',
  },
  {
    repo: 'postcss/postcss.org',
    description: 'The PostCSS website.',
  },
  {
    repo: 'mxstbr/mxstbr.com',
    description: "This very website's source code!",
  },
  {
    repo: 'mxstbr/passport-magic-login',
    description: 'Passwordless authentication with magic links for Passport',
  },
  {
    repo: 'mxstbr/fifteen-kilos',
    description: 'Fifteen kilos',
  },
  {
    repo: 'mxstbr/awesome-austria',
    description:
      'A curated list of things that show the awesome side of Austria',
  },
  {
    repo: 'mxstbr/pgp.asc',
    description: 'An initiative to decentralize public PGP keys',
  },
  {
    repo: 'micro-analytics/micro-analytics-cli',
    description:
      'Public analytics as a Node.js microservice. No sysadmin experience required!',
  },
  {
    repo: 'system-ui/theme-ui',
    description:
      'Build consistent, themeable React apps based on constraint-based design principles',
    owner: false,
  },
  {
    repo: 'nice-boys/product-boilerplate',
    description: 'Quickly ship your apps with the power of code generation.',
  },
  {
    repo: 'nice-boys/components',
    description: "@brianlovin and @mxstbr's component library",
  },
]

export default ossProjects
