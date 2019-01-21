export const frontmatter = {
  "published": true,
  "title": "Writing your styles in JS ≠ writing inline styles",
  "tags": "styling react inline css-in-js",
  "custom_excerpt": "Many people don't realise is that there's a difference between what's called \"inline styles\" and what's called \"CSS-in-JS\". Do you know?"
};



With the emergence and popularity of libraries like Radium, JSS, Aphrodite and `styled-components` everybody has been talking about writing styles in JavaScript. What many people don't realise is that there's a difference between what's called "inline styles" and what's called "CSS-in-JS".

Writing your styles in JavaScript ≠ writing inline styles!

## Inline styles

As the name might suggest, "inline styles" attach your styles inline to the actual DOM nodes. This works natively with React by using the `style` prop, or you can use a library like [Radium](https://github.com/FormidableLabs/radium).

This is what using inline styles looks like:

```javascript
const styles = {
  backgroundColor: 'palevioletred',
  color: 'papayawhip',
};

<button style={styles} />
```

> No matter if you're using native React inline styles or Radium, both of them look the same way.

In the actual browsers DOM, React goes ahead and attaches those styles as strings to the DOM nodes:

```html
<button style="background-color: palevioletred; color: papayawhip;" />
```

Inline styles only support a subset of CSS. Putting your styles inline into the DOM means you cannot use pseudo selectors, media queries, keyframes etc. (because the browser doesn't recognise those things)

## CSS-in-JS

CSS-in-JS libraries let you write your styles in JavaScript too, just like inline styles, but then they take those styles and inject an actual string of CSS in a `<style>` tag into the DOM.

CSS-in-JS does not have native support in React, but there are lots of different libraries to make CSS-in-JS happen.

Let's take a look at what using CSS-in-JS looks like at the example of [`aphrodite`](https://github.com/khan/aphrodite):

```javascript
import { StyleSheet, css } from 'aphrodite';

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'palevioletred',
    color: 'papayawhip',
  },
});

<button className={css(styles.button)} />
```

If you take a look into the DOM this is what you'll see:

```html
<style>
.1kt7baa {
  background-color: palevioletred;
  color: papayawhip;
}
</style>

<button class="1kt7baa" />
```

The same is also the case for [`styled-components`](https://github.com/styled-components/styled-components). If you look at a `styled-components` example, you won't see anything being attached to the `className` prop but `styled-components` does that under the hood:

```javascript
import styled from 'styled-components';

const Button = styled.button`
  background-color: palevioletred;
  color: papayawhip;
`
```

Rendering this `<Button>` component will output this to the DOM:

```html
<style>
.dRUXBm {
  background-color: palevioletred;
  color: papayawhip;
}
</style>

<button class="dRUXBm" />
```

> Other examples of CSS-in-JS libraries include [JSS](https://github.com/cssinjs/jss), [`glamor`](https://github.com/threepointone/glamor) and many more.

## Differences

As mentioned above, the major difference is that inline styles only support a subset of CSS. Using a library like Radium remedies some of that, but not all of it.

Radium wraps your components and adds support for `:hover` and media queries to your inline styles by attaching event handlers. Not all CSS features can be aliased with JavaScript event handlers though, many pseudo selectors (like `:disabled`, `:before`, `:nth-child`) aren't possible, styling the `html` and `body` tags isn't supported etc.

With CSS-in-JS, you have all the power of CSS at your fingertips. Since actual CSS is generated, you can use every media query and pseudo selector you can think of. Some libraries (like `jss`, `styled-components`) even add support for neat, non-CSS-native features like nesting!

Let's take a look at a more complex example with `styled-components`:

```javascript
import styled from 'styled-components';

const Box = styled.div`
  background-color: papayawhip;

  /* Pseudo selectors! */
  &:after {
    content: "";
    display: table;
    clear: both;
  }

  /* Media queries! */
  @media screen and (min-width: 750px) {
    background-color: seagreen;
  }
`;
```

Instead of calling  this group of libraries that let you write styles in JavaScript "CSS-in-JS" or "Inline Styles" (both of which don't apply to all of those) let's call them what they really are: **"Styles in JavaScript" libraries!**
