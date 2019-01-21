export const frontmatter = {
  "published": true,
  "title": "Rem Font Sizing",
  "tags": "css sass mixin"
};



I love using `rem` units for font-sizing on my web pages. It makes responsiveness much easier to implement, and you cannot get tangled up in a mess of nested `em`s. In fact, have a look at the source code of this blog — `rem` everywhere! The easiest way to use `rem`s is to set the base font-size to 62.5%.

```CSS
body {
    font-size: 62.5%;
}
```

This changes the base font size from 16px to 10px, if the user hasn't globally overridden it in their browser. This means `1.4rem` is equal to 14px! Want to make text 16px big? Just set the font-size of your element to `1.6rem`!

This approach has one problem though: Sometimes (I am not sure why), Google Chrome renders the page with the font size set to 100%, ignoring the `font-size : 62.5%` declaration. To fix this issue, I wrote a short Sass mixin which makes the base font size change irrelevant. It also adds a `px` fallback for older browsers that do not support `rem`s, and works for all properties, from font-size over line-height to padding.

```Sass
@mixin rem($property, $value) {
    #{$property}: #{$value}px;
    #{$property}: #{$value * 0.0625}rem;
}
```

To use it, `@include` the mixin like this:

```Sass
.some-element {
    @include rem(font-size, 16);
    @include rem(line-height, 24);
}
```

which compiles to

```CSS
.some-element {
    font-size: 16px;
    font-size: 1rem;
    line-height: 24px;
    line-height: 1.5rem;
}
```

This eliminates the need to set the body font-size to 62.5%! 

Hope this post made the `rem` unit a bit clearer, if you have any questions don’t hesitate to contact me on [Twitter](https://twitter.com/mxstbr)!