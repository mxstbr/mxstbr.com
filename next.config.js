const withMDX = require("@zeit/next-mdx")({
  extension: /\.mdx?$/
});
const fs = require("fs");
const { join } = require("path");
const { promisify } = require("util");
const copyFile = promisify(fs.copyFile);

const staticFilesToCopy = ["now.json", "favicon.ico"];

module.exports = withMDX({
  pageExtensions: ["js", "jsx", "mdx", "md"],
  exportPathMap: async function(
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    if (dev) return defaultPathMap;
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
    return config;
  }
});
