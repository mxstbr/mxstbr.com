import BlogPost from "../../components/BlogPost";

export const meta = {
  published: false,
  publishedAt: "2019-01-30",
  title: "How does CSS-in-JS work?",
  summary: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

Conceptually, CSS-in-JS libraries take your styles, hash them to create a unique class name and insert that whole block into the DOM.

For example:

```js
import styled from "styled-components";

const Title = styled.h1`
  color: palevioletred;
  font-size: 1.5em;
`;

const App = () => <Title>Hello World!</Title>;
```

would render the following to the DOM:

```html
<h1 class="cMWNzn">Hello World!</h1>
```

```css
.cMWNzn {
  color: palevioletred;
  font-size: 1.5em;
}
```

#### Is CSS-in-JS slow?

No. The CSSOM can insert 10,000 unique CSS rules (i.e. classes) in ~60ms ([source](https://twitter.com/threepointone/status/758095801558011904)). Since only the CSS of components that are used on the current page is injected, you will never even come close to 10,000 unique CSS rules.
