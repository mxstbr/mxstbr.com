import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'Writing CSS in JavaScript: What, How, Who and Why?',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

“CSS-in-JS” refers to a set of libraries that make it possible to write CSS in JavaScript. The most popular one is [styled-components](https://styled-components.com) (which I co-created), but there are [many others](https://github.com/michelebertoli/css-in-js).

For example, here is what using styled-components with React looks like:

```js
import styled from 'styled-components';

const Title = styled.h1`
  color: palevioletred;
  font-size: 1.5em;
`

const App = () => (
  <Title>Hello World!</Title>
)
```

### Who is CSS-in-JS for?

If you are using a JavaScript framework (e.g. React) to build a web app, especially if you are part of a team, you would likely benefit from CSS-in-JS.

#### Is anybody using CSS-in-JS?

Yes.

- [In October, around 50% of npm installs including React also included a CSS-in-JS library](https://twitter.com/mxstbr/status/1049194935428308992).
- Many companies use it, including Airbnb, Atlassian, Vogue, Bloomberg, BBC News, Coinbase, and thousands of others.

[(this website is also built with styled-components)](https://github.com/mxstbr/mxstbr.com)

### Why would you use CSS-in-JS?

**CSS-in-JS is about increasing the confidence in your code.** It lets you write, change and delete CSS knowing it will not have any unintended consequences.

Many web developers have felt the horror of [the "append-only stylesheet"](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/). Time flies by on a project, and it seems like CSS is only ever added, but never removed.

There is no need for complex methodologies or intricate code reviews to avoid the append-only stylesheet with CSS-in-JS libraries. They take care of managing your styling for you.

For example, if you are working on the styling of an `Accordion` component, you can be sure your changes will not affect anything else. If you delete the `Accordion` component, you also automatically delete all its CSS.

#### Other Benefits of CSS-in-JS

Apart from that, moving your CSS to JavaScript also has a couple other nice side benefits:

- **Automatic critical CSS**: styles are bound to components, so most CSS-in-JS libraries only inject the CSS of components that are used on the page
- **Simple dynamic styling**: whether you need to adjust the styles of a component based on different states or a global theme, CSS-in-JS makes it simple
- **Painless maintenance**: styles are explicitly bound to specific components, so you never have to hunt across your codebase to figure out which CSS rule is affecting your component
- **All the features of CSS preprocessors**: autoprefixing comes supported out of the box, and all other preprocessor features (like mixins, variables, etc) are built into JavaScript

### How does CSS-in-JS work?

Conceptually, CSS-in-JS libraries take your styles, hash them to create a unique class name and insert that whole block into the DOM.

For example, the above example would render:

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
