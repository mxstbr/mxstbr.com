import BlogPost from '../../components/BlogPost';
import Lesson from '../../components/Lesson';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'Why I Write CSS in JavaScript',
  summary: ''
}

export default BlogPost

For three years, I have styled my web apps without any `.css` files. Instead, I wrote all the CSS in JavaScript.

I know what you are thinking, why would anybody write CSS in JavaScript?! Let me explain.

### What Does CSS-in-JS Look Like?

Developers have created [different flavors of CSS-in-JS](https://github.com/michelebertoli/css-in-js). The most popular is [styled-components](https://styled-components.com), a library I co-created. Using it with React looks like this:

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

Note how it ties styles to specific components and lets you write them in JavaScript.

### Why I Write CSS in JavaScript

Primarily, using CSS-in-JS boosts my confidence. I can add, change and delete CSS without unexpected consequences. I avoid the ["append-only stylesheet"](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/) effortlessly.

My changes to the styling of a component will not affect anything else. If I delete a component, I automatically delete its CSS too.

<Lesson
  title="Confidence"
  body="Add, change and delete CSS without unexpected consequences and avoid dead code."
/>

This confidence boost is especially vital for teams. Not everybody has a comprehensive understanding of CSS and deadlines can get in the way of quality. With CSS-in-JS our codebase stays clean and we avoid common CSS frustrations (e.g. class name collisions).

<Lesson
  title="Better Teamwork"
  body="Keep your codebase clean and avoid common bugs, regardeless of experience levels."
/>

Since styles are bound to a specific component, I always know what is affecting it. I can come back two years after first writing some code and I will know exactly what is going on.

<Lesson
  title="Painless maintenance"
  body="Never go on a hunt for that one CSS declaration breaking your component ever again."
/>

CSS-in-JS libraries keep track of the components I use on a page and only inject their styles. Every user loads the least styles possible when server-side rendering.

<Lesson
  title="Fast first paint"
  body="Automatically extract the critical CSS and send the least amount of code possible over the wire."
/>

I can simply adjust the styles of a component based on different states (`<Button variant="primary">` vs `<Button variant="secondary">`) or a global theme.

<Lesson
  title="Simple dynamic styling"
  body="Style your components with a global theme. Never concatenate classnames again."
/>

CSS-in-JS still offers all the important features of CSS preprocessors. All libraries have auto-prefixing built in, and other features like mixins (functions) and variables are native to JavaScript.

### Who Has Adopted CSS-in-JS?

Thousands of companies use CSS-in-JS in production, including Reddit, Patreon, LEGO, Target, Atlassian, Vogue, Bloomberg, BBC News, GitHub, Coinbase, and many more. ([I also built this website with styled-components](https://github.com/mxstbr/mxstbr.com))

### Should You Use CSS-in-JS?

If you are using a JavaScript framework to build a web app with components, especially as part of a team, CSS-in-JS might be a good fit. I would recommend trying it on a small project and seeing whether it feels good.
