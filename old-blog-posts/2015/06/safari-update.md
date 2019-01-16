export const frontmatter = {
  "published": false,
  "title": "Rem Font Sizing",
  "tags": "css sass mixin"
};




The most important news in Safari 9.0 for Frontend Devs
Safari 9.0: News
Great new features in Safari 9.0
Whats new in Safari?
Is Safari useful again?
Top 3 Safari changes


# Icons for Pinned Tabs

You can now set the icons for pinned tabs in Safari using this meta tag:

```HTML
<link rel="icon" sizes="any" mask href="website_icon.svg">
```

where `website_icon.svg` is your icon in SVG format. Icons need to be perfect black (i.e. `#000000` or `rgb(0, 0, 0)`) because the colour is set with the second new meta tag:

```HTML
<meta name="theme-color" content="red">
```

The colour in this meta tag can be replaced with any colour in HEX or RGB notation, or any recognised keyword like `red`, `yellow` or `green`.

# Filters

Safari now has support for the CSS3 `filter` property.

# Responsive Design Mode

There now is a Responsive Design Mode, accessible by pressing XYZ, where you can look at your website at different screen sizes.