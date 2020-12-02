const fetch = require("isomorphic-unfetch");

exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest
}) => {
  const data = await fetch("https://mxstbr.blog/feed.json").then(res =>
    res.json()
  );

  data.items.forEach(post => {
    const nodeData = {
      title: post.title,
      publishedAt: post.date_published,
      path: post.url,
      external: post["_external-site"]
    };

    actions.createNode({
      id: createNodeId(post.id),
      parentNode: null,
      internal: {
        type: `OldBlogPost`,
        contentDigest: createContentDigest(nodeData)
      },
      ...nodeData
    });
  });
};
