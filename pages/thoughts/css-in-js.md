import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-01-17',
  title: 'Writing CSS in JavaScript: What, How, Who and Why?',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

CSS-in-JS is the result of the React community trying to enhance CSS for component systems. By honing in on a single use case we optimized the experience for both developers and end users.

### What is CSS-in-JS?

CSS-in-JS refers to a set of libraries that make it possible to write CSS in JavaScript. The most popular one is [styled-components](https://styled-components.com) (disclaimer: I am the co-creator), but there are [many others](https://github.com/michelebertoli/css-in-js).

For example, here is what styled-components looks like:

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

### Who is CSS-in-JS for?

If you are using a JavaScript framework (e.g. React) to build a “web app”, especially if you are part of a team, you would likely benefit from CSS-in-JS.

#### Is anybody using CSS-in-JS?

Yes.

- [In October, around 50% of npm installs including React also included a CSS-in-JS library](https://twitter.com/mxstbr/status/1049194935428308992).
- Many many many companies use it, including big ones like Airbnb, Atlassian, Vogue, Bloomberg, BBC News, Coinbase, and thousands of others.

### Why would you use CSS-in-JS?

**First and foremost, CSS-in-JS is about increasing the confidence in your code.** The confidence to write and change CSS because you know it only affects a single component. The confidence to remove CSS because you know it is unused.

Many web developers have felt the horror of [the "append-only stylesheet"](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/). Time flies by on a project, and it seems like CSS is only ever added, but never removed.

There is no need for complex methodologies or intricate code reviews to avoid the append-only stylesheet with CSS-in-JS. It happens automatically without you having to think about it.

You are working on the styling of the `Button` component? You know if will only affect the `Button`. You delete the unused `Accordion` component? You also delete its CSS and know for sure that you did not break anything else.

#### Other Benefits of CSS-in-JS

Since styles are bound to components, most CSS-in-JS libraries automatically only inject the CSS of components that are used on the page.

- Automatic critical CSS
- Prevent class name bugs
- Simple dynamic styling
- Easier maintenance
- + all the features of CSS preprocessors
