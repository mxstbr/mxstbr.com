import BlogPost from '../../components/BlogPost';
import Lesson from '../../components/Lesson';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'Why I Write CSS in JavaScript',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

I am the co-creator of [styled-components](https://styled-components.com), the most widely used CSS in JavaScript ("CSS-in-JS") library. CSS-in-JS libraries let you write styles in JavaScript and tie them to specific components.

I know what you are thinking, why would anybody write CSS in JavaScript?! Let me explain.

### The Rationale Behind CSS-in-JS

Here is what using styled-components with React looks like:

```js
import styled from 'styled-components'

const Title = styled.h1`
  color: palevioletred;
  font-size: 1.5em;
`

const App = () => (
  <Title>Hello World!</Title>
)
```

Primarily, CSS-in-JS boosts your confidence. You can add, change and delete CSS without unexpected consequences. You avoid the ["append-only stylesheet"](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/)automatically, without complex tooling or years of experience.

If you are working on the styling of a component, your changes will not affect anything else. If you delete the component, you automatically delete its CSS.

<Lesson
  title="Confidence"
  body="Add, change and delete CSS without unexpected consequences."
/>

This confidence boost is especially vital for teams. Not everybody has a comprehensive understanding of CSS and deadlines can get in the way of quality. With CSS-in-JS your codebase stays clean and you avoid common CSS frustrations (e.g. class name collisions).

<Lesson
  title="Better Teamwork"
  body="Keep your codebase clean and avoid common bugs, no matter the experience level of the team members."
/>

Since styles are bound to a specific component, you always know what is affecting it. You can come back two years after first writing some code and you will know exactly what is going on.

<Lesson
  title="Painless maintenance"
  body="Never go on a hunt for that one CSS declaration breaking your component ever again."
/>

CSS-in-JS libraries keep track of the components you use on a page and only inject their styles. Every user will load the least styles possible when server-side rendering.

<Lesson
  title="Fast first paint"
  body="Automatically extract the critical CSS and send the least amount of code possible from the server."
/>

Simply adjust the styles of a component based on different states (`<Button variant="primary">` vs `<Button variant="secondary">`) or a global theme.

<Lesson
  title="Simple dynamic styling"
  body="Style your components with a global theme. Never concatenate classnames again."
/>

CSS-in-JS still has all the important features of CSS preprocessors. Auto-prefixing is built in, and others like mixins, variables, and many others come with JavaScript.

### Who Has Adopted CSS-in-JS?

Thousands of companies use CSS-in-JS in production, including Reddit, Patreon, LEGO, Target, Atlassian, Vogue, Bloomberg, BBC News, GitHub, Coinbase, and many more. ([I also built this website with styled-components](https://github.com/mxstbr/mxstbr.com))

### Should You Use CSS-in-JS?

If you are using a JavaScript framework to build a web app with components, especially as part of a team, CSS-in-JS might be a good fit. I would recommend trying it on a small project and seeing whether it feels good.
