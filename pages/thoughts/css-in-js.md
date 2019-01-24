import BlogPost from '../../components/BlogPost';
import Lesson from '../../components/Lesson';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'Why I Write CSS in JavaScript',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

CSS in JavaScript (“CSS-in-JS”) refers to a set of libraries that make it possible to write CSS in JavaScript and tie the styles to a specific component. The most popular one is [styled-components](https://styled-components.com) (which I co-created), but there are [many others](https://github.com/michelebertoli/css-in-js).

For example, here is what using styled-components (with React) looks like:

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

### Why?

<!-- CSS-in-JS makes machines handle the tasks we humans are not good at. It removes the global namespace for classes and ties styles to specific components. -->

CSS-in-JS increases your confidence in the code. You can add, change and delete CSS without unintended consequences. You avoid the ["append-only stylesheet"](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/) without complex tooling or decades of experience.

If you are working on the styling of a component, you can be sure your changes will not affect anything else. If you delete the component, you also automatically delete its CSS.

<Lesson
  title="Confidence"
  body="Add, change and delete CSS without unintended consequences."
/>

This confidence boost is especially vital for teams. Not everybody has the best understanding of CSS, and CSS-in-JS ensures a whole class of bugs (e.g. name collision) cannot happen.

<Lesson
  title="Better Teamwork"
  body="Make common mistakes impossible and lighten your seniors' code review load."
/>

Since styles are bound to a specific component, you always know what is affecting it. You can come back two years after first writing some code and you will know exactly what is going on.

<Lesson
  title="Painless maintenance"
  body="Never go on a hunt for that one CSS declaration breaking your component ever again."
/>

CSS-in-JS libraries keep track of which components are used on a page and only inject their styles. That means every user will only load the styles necessary for their first paint when server-side rendering.

<Lesson
  title="Fast first paint"
  body="Automatically extract the critical CSS and send the least amount of code possible from the server."
/>

Whether you need to adjust the styles of a component based on different states (`<Button variant="primary">` vs `<Button variant="secondary">`) or a global theme, CSS-in-JS makes it simple.

<Lesson
  title="Simple dynamic styling"
  body="Style your components with a global theme. Never concatenate classnames again."
/>

CSS-in-JS still has all the important features of CSS preprocessors. Auto-prefixing is built in, and others like mixins, variables, and many others come with the language.

That is why I personally use and recommend CSS-in-JS.

### Who else is using CSS-in-JS?

Thousands of companies use CSS-in-JS in production, including Reddit, Patreon, LEGO, Target, Atlassian, Vogue, Bloomberg, BBC News, GitHub, Coinbase, and many more. ([I also built this website with styled-components](https://github.com/mxstbr/mxstbr.com))

### Is CSS-in-JS for you?

If you are using a JavaScript framework to build a web app with components, especially as part of a team, CSS-in-JS might be a good fit. I would recommend trying it on a small project and seeing whether it feels good.
