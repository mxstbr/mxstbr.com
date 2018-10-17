const fs = require("fs");
const path = require("path");

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const FRONTMATTER = /export const frontmatter = ({(.|\n)+?})/;

let posts = [];

walkDir(path.join(__dirname, "./pages/blog"), file => {
  if (path.extname(file) !== ".md") return;
  const post = fs.readFileSync(file, "utf8");
  let frontmatter;
  try {
    frontmatter = JSON.parse(post.match(FRONTMATTER)[1]);
  } catch (err) {
    console.log("error in", file);
    throw err;
  }

  if (!frontmatter.published) return;

  posts.push(frontmatter);
});

module.exports = posts.reverse();
