const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");

const posts = fs
  .readdirSync(path.join(__dirname, "./pages/blog"))
  .filter(name => name.endsWith(".md"));

const regexp = /(\d{4})-(\d{2})-\d{2}-(.+)\.md/;

posts.forEach(name => {
  const [, year, month, slug] = name.match(regexp);
  const file = path.join(__dirname, "./pages/blog", name);
  const folder = path.join(
    __dirname,
    "./pages/blog",
    String(year),
    String(month)
  );
  mkdirp(folder, err => {
    if (err) throw err;
    const newFile = path.join(
      __dirname,
      "./pages/blog",
      String(year),
      String(month),
      `${slug.toLowerCase()}.md`
    );
    fs.rename(file, newFile, () => {
      if (err) throw err;
      console.log("Moved", name);
      console.log("\n");
    });
  });
});
