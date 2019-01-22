const withMDX = require("@zeit/next-mdx")({
  extension: /\.mdx?$/,
  options: {
    // $FlowIssue
    hastPlugins: [require("@mapbox/rehype-prism")]
  }
});
const fs = require("fs");
const { join } = require("path");
const generateJsonFeed = require("./data/generate-json-feed");
const { promisify } = require("util");
const copyFile = promisify(fs.copyFile);

const staticFilesToCopy = ["favicon.ico"];

module.exports = withMDX({
  pageExtensions: ["js", "jsx", "mdx", "md"],
  exportPathMap: async function(
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    if (dev) return defaultPathMap;
    generateJsonFeed(outDir);
    await Promise.all(
      staticFilesToCopy.map(file =>
        copyFile(join(dir, file), join(outDir, file))
      )
    );
    return defaultPathMap;
  },
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
    config.module.rules.push({
      test: /.css$/,
      use: "raw-loader"
    });
    return config;
  }
});
