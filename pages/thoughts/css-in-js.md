import BlogPost from '../../components/BlogPost';
import Lesson from '../../components/Lesson';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'Why You Should Write CSS in JavaScript',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

“CSS-in-JS” refers to a set of libraries that make it possible to write CSS in JavaScript and tie the styles to a specific component. The most popular one is [styled-components](https://styled-components.com) (which I co-created), but there are [many others](https://github.com/michelebertoli/css-in-js).

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

### Is CSS-in-JS for you?

If you are using a JavaScript framework (e.g. React) to build a web app with components, especially as part of a team, you would likely benefit from adopting CSS-in-JS.

#### Who is using CSS-in-JS?

Thousands of companies use CSS-in-JS in production, including Reddit, Patreon, LEGO, Target, Atlassian, Vogue, Bloomberg, BBC News, GitHub, Coinbase, and many more. ([I also built this website with styled-components](https://github.com/mxstbr/mxstbr.com))

### Why should you use CSS-in-JS?

CSS-in-JS makes machines handle the tasks we humans are not good at. It removes global classes and ties styles to specific components. Why is that nice?

#### Confidence

First and foremost, CSS-in-JS increases the confidence in your code. You can add, change and delete CSS without unintended consequences. You do not need complex tooling or a detailed understanding of the entire codebase to avoid the ["append-only stylesheet"](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/), it happens automatically.

For example, if you are working on the styling of an `Accordion` component, you can be sure your changes will not affect anything else. If you delete the `Accordion` component, you also automatically delete all its CSS.

<Lesson
  title="Reason 1"
  body="Increase the confidence in your code. Add, change and delete CSS without unintended consequences."
/>
<Lesson
  title="Reason 2"
  body="Never go on a hunt for that one CSS declaration breaking your component ever again."
/>

Most CSS-in-JS libraries keep track of which components are used on a page and only inject their styles.

#### Other Benefits of CSS-in-JS

Apart from that, moving your CSS to JavaScript also has a couple other nice side benefits:

- **Automatic critical CSS**: styles are bound to components, so most CSS-in-JS libraries only inject the CSS of components that are used on the page
- **Simple dynamic styling**: whether you need to adjust the styles of a component based on different states or a global theme, CSS-in-JS makes it simple
- **Painless maintenance**: styles are explicitly bound to specific components, so you never have to hunt across your codebase to figure out which CSS rule is affecting your component
- **All the features of CSS preprocessors**: autoprefixing comes supported out of the box, and all other preprocessor features (like mixins, variables, etc) are built into JavaScript
