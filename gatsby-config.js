const path = require(`path`);
const refract = require("refractor");

// NOTE: This highlights template-strings as strings of CSS
const styledHighlight = {
  "styled-template-string": {
    pattern: /(styled(\.\w+|\([^\)]*\))(\.\w+(\([^\)]*\))*)*|css|injectGlobal|createGlobalStyle|keyframes|\.extend|\.withComponent)`(?:\$\{[^}]+\}|\\\\|\\?[^\\])*?`/,
    lookbehind: true,
    greedy: true,
    inside: {
      interpolation: {
        pattern: /\$\{[^}]+\}/,
        inside: {
          "interpolation-punctuation": {
            pattern: /^\$\{|\}$/,
            alias: "punctuation"
          },
          rest: refract.languages.jsx
        }
      },
      string: {
        pattern: /[^$;]+/,
        inside: refract.languages.css,
        alias: "language-css"
      }
    }
  }
};
refract.languages.insertBefore("jsx", "template-string", styledHighlight);
refract.languages.insertBefore("js", "template-string", styledHighlight);

module.exports = {
  siteMetadata: {
    siteUrl: `https://mxstbr.com`
  },
  plugins: [
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-flow`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-layout`,
      options: {
        component: require.resolve(`./src/App`)
      }
    },
    // Support .mdx pages
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages/`
      }
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        rehypePlugins: [require("@mapbox/rehype-prism")],
        extensions: [`.mdx`, `.md`]
      }
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-49258834-4`
      }
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        feeds: [
          {
            title: `Max Stoibers (@mxstbr) Thoughts`,
            description: `Candid thoughts about React.js, Node.js, startups and other interesting things.`,
            link: `https://mxstbr.com/thoughts`,
            output: `/rss`,
            query: `
              {
                allBlogPost {
                  nodes {
                    title
                    summary
                    publishedAt
                    path
                  }
                }
              }
            `,
            serialize: ({ query: { allBlogPost } }) => {
              return allBlogPost.nodes.map(post => ({
                title: post.title,
                description: post.summary,
                url: path.join(`https://mxstbr.com`, post.path)
              }));
            }
          }
        ]
      }
    }
  ]
};
