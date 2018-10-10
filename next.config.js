const withMDX = require("@zeit/next-mdx")();

module.exports = withMDX({
  pageExtensions: ["js", "jsx", "mdx"],
  webpack(config, options) {
    config.module.rules.push({
      test: /.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true
          }
        }
      ]
    });
    return config;
  }
});
