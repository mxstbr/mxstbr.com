export const frontmatter = {
  "published": true,
  "title": "My Top 5 PostCSS Plugins",
  "tags": "css postcss"
};



There has been a lot of talk recently about a new CSS preprocessor called PostCSS.[^1] PostCSS is a wrapper for plugins which exposes an easy to use, but powerful API. Plugins can then use this API to change something in your CSS – or not. This makes PostCSS modular and extensible. While it is possible to [replicate other preprocessors features](https://github.com/jonathantneal/precss), PostCSS [can](https://github.com/anandthakker/doiuse) [do](https://github.com/MohammadYounes/rtlcss) [so](https://github.com/jonathantneal/postcss-font-magician) [much](https://github.com/postcss/autoprefixer) [more](http://cssnano.co/optimisations/).

Using PostCSS is as easy as including it into your build system. There are integrations with all the popular ones, so there is no excuse not to use it. The harder part is choosing from the wealth of plugins. [PostCSS.parts](http://postcss.parts) helps searching for features you want to add to your CSS.

To get you started with PostCSS, here are my must-have plugins for every project:

1. `postcss-import` and `postcss-simple-vars`
Variables and inlined `@import` stylesheets were my number one most used Sass features. They improve style consistency and code structure and make modular thinking easier. The first thing I did was search for a suitable replacement for these features. [`postcss-import`](https://github.com/postcss/postcss-import) and [`postcss-simple-vars`](https://github.com/postcss/postcss-simple-vars) replicate the functionality perfectly, so they are a definite must-have.

2. `postcss-focus`
Wherever you use a `:hover` in your CSS, you should add a `:focus` as well.[^2] To make sure I do not forget to add it, [`postcss-focus`](https://github.com/postcss/postcss-focus) takes care of adding it for me.

3. `autoprefixer`
Making sure your page looks the same no matter which browser/device it is viewed on is very important today. Vendor prefixes and browser fallbacks are a big part of doing that. Sadly, there are a lot of them and I tend to forget them. [`autoprefixer`](https://github.com/postcss/autoprefixer) takes care of prefixing your CSS based on browser usage data. This means you can focus on the styling, and let `autoprefixer` take care of cross-platform quirks.

4. `doiuse`
You might have certain browser versions you want to support on your website. [`doiuse`](https://github.com/anandthakker/doiuse) checks your CSS and warns you if you use a feature that is not supported by the minimum browser support you specify.

5. `cssnano`
Optimising your CSS is vital. Performance is a big topic around the front-end development world, and delivering the least amount of data possible is crucial. [`cssnano`](https://github.com/ben-eb/cssnano) is a collection of various PostCSS plugins that make your code as small as possible. The most obvious one is whitespace removal, but `cssnano` also renames custom identifiers (e.g. animation names), merges adjacent rules and more.

These five plugins will give you a head start for developing performant, cross-browser compatible styling. Even with these heavy hitting tasks, compilation times are smaller than what they were using other preprocessors.

[^1]: Yes, [PostCSS is a preprocessor](https://css-tricks.com/the-trouble-with-preprocessing-based-on-future-specs/)

[^2]: Only using `:hover` makes your content unaccessible to non-mouse users. [See here for more information](http://www.456bereastreet.com/archive/201004/whenever_you_use_hover_also_use_focus/)
