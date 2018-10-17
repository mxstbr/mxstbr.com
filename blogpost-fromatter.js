const fs = require("fs");
const path = require("path");
const { loadFront } = require("yaml-front-matter");

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, "./pages/blog"), file => {
  if (path.extname(file) !== ".md") return;
  const post = fs.readFileSync(file, "utf8");
  let meta = loadFront(post);
  const content = meta.__content;
  delete meta.__content;
  const newPost = `export const frontmatter = ${JSON.stringify(meta, null, 2)};

${content}`;

  fs.writeFileSync(file, newPost);
});
