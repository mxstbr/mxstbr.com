import BlogPost from '../../components/BlogPost';
import Browser from '../../components/BrowserDemo';
import Lesson from '../../components/Lesson';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'Why I Write CSS in JavaScript',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

For three years, I have styled my web apps without any `.css` files. Instead, I wrote all the CSS in JavaScript.

I know what you are thinking, why would anybody write CSS in JavaScript?! Let me explain.

### What Does CSS-in-JS Look Like?

Developers have created [different flavors of CSS-in-JS](https://github.com/michelebertoli/css-in-js). The most popular is a library I co-created with over 20,000 stars on GitHub called [styled-components](https://styled-components.com). Using it with React looks like this:

```js
import styled from 'styled-components'

const Title = styled.h1`
  color: palevioletred;
  font-size: 18px;
`

const App = () => (
  <Title>Hello World!</Title>
)
```

Note how it ties styles to specific components and lets you write them in JavaScript. This is what the above code renders:

<Browser html={`
  <style>
    .faEkXI {
      font-size: 18px;
      color: palevioletred;
    }
  </style>
  <h1 class="sc-ifAKCX faEkXI">Hello World!</h1>
`}/>

### The Benefits of CSS-in-JS

Primarily, using CSS-in-JS boosts my confidence. I can add, change and delete CSS without unexpected consequences. My changes to the styling of a component will not affect anything else.

CSS-in-JS prevents the [“append-only stylesheet”](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/) automatically. If I delete a component, I delete its CSS too. 🚮

<Lesson
  title="Confidence"
  body="Add, change and delete CSS without unexpected consequences and avoid dead code."
/>

Teams especially benefit from this confidence boost. One cannot expect everybody to have a comprehensive understanding of CSS. On top of that, deadlines can get in the way of quality.

With CSS-in-JS my teams codebase stays clean and we avoid common CSS frustrations like class name collisions. ✅

<Lesson
  title="Enhanced Teamwork"
  body="Keep your codebase clean and avoid common CSS bugs, regardeless of experience levels."
/>

I always know why a component looks the way it does. All styles affecting it are beside it. If they are not (e.g. because another component has overrides), I can find them with a quick search. 😍

<Lesson
  title="Painless Maintenance"
  body="Never go on a hunt for CSS affecting your components ever again."
/>

CSS-in-JS libraries keep track of the components I use on a page and only inject their styles. Every user downloads the least code possible when server-side rendering.

Automatic critical CSS! 🤯

<Lesson
  title="Fast Performance"
  body="Automatically extract the critical CSS and send the least amount of code possible over the wire."
/>

I can adjust the styles of a component based on different states (`<Button variant="primary">` vs `<Button variant="secondary">`) or a global theme.

If I dynamically change that context all my components will apply the correct styles automatically. 💅

<Lesson
  title="Dynamic Styling"
  body="Simply style your components with a global theme or implement different states."
/>

CSS-in-JS still offers all the important features of CSS preprocessors. All libraries support auto-prefixing, and JavaScript offers most other features like mixins (functions) and variables natively.

### The Downsides of CSS-in-JS

Technically diverse organizations should make sure their library of choice works with all the projects' tech stacks using the shared components.

Users have to load, parse and execute more JavaScript.

### Who Has Adopted CSS-in-JS?

Thousands of companies use CSS-in-JS in production, including Reddit, Patreon, LEGO, Target, Atlassian, Vogue, Bloomberg, BBC News, GitHub, Coinbase, and many more. ([I also built this website with styled-components](https://github.com/mxstbr/mxstbr.com))

### Should You Use CSS-in-JS?

If you are using a JavaScript framework to build a web app with components, especially as part of a team, CSS-in-JS might be a good fit. I would recommend trying it on a small project and seeing whether it feels good.
