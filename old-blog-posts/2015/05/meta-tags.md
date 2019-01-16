export const frontmatter = {
  "published": false,
  "title": "Meta tags",
  "tags": "html meta"
};



Meta tags are annoying. There is a lot of them, and I definitely don't remember which ones I can include. This post serves as a documentation to quickly look up which meta tags one can include.

# Technical

## Charset

```HTML
<meta charset="UTF-8">
```

The charset meta tag has to be included in the first 1024 bytes of the HTML [^1], and should be the very first meta tag as the page might have to rerender after discovering it.

## Compatibility Mode

```HTML
<meta http-equiv="x-ua-compatible" content="ie=edge">
```

This meta tag ensures that Internet Explorer renders your page with the latest rendering engine, even in [cases it might not normally](https://hsivonen.fi/doctype/#ie8). This ensures that important, new CSS/JS/… features are available and can be used.

Another, preferable option is to send the webpage with the HTTP response header `X-UA-Compatible` set to `IE=edge`. It accomplishes the same thing as the meta tag, but cannot be overridden by user settings. [^2]

## Mobile Viewport

```HTML
<meta name="viewport" content="width=device-width, initial-scale=1">
```

This meta tag specifies how the webpage should be rendered on mobile devices, and almost always has to be included on responsive web sites. [^3] 

There is a lot of options one can set in this meta tag, check out the [Apple Developer Docs](https://developer.apple.com/library/safari/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html) for more information. The above meta tag includes the most important options, and should work for most cases.





[^1]: https://html.spec.whatwg.org/multipage/semantics.html#charset

[^2]: This would happen if the webpage is viewed on a non-default port (i.e. not port 80, for example if the website is viewed locally), as the IE setting `Display intranet sites in Compatibility View` is checked by default. This overrides the meta tag and renders the page with an older rendering engine, but the HTTP header does not get overridden by this setting.

[^3]: Check “A Word about the Viewport” https://msdn.microsoft.com/en-us/magazine/hh653584.aspx