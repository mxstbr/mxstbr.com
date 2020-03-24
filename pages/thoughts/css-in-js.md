import BlogPost from "../../components/BlogPost";
import Browser from "../../components/BrowserDemo";
import Lesson from "../../components/Lesson";

export const meta = {
  published: true,
  publishedAt: "2019-02-18",
  title: "Why I Write CSS in JavaScript",
  summary:
    "For three years, I have styled my web apps without any `.css` files. Instead, I have written all the CSS in JavaScript. Let me explain.",
  image: "/static/images/css-in-js.png",
  likes: 1680
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

For three years, I have styled my web apps without any `.css` files. Instead, I have written all the CSS in JavaScript.

I know what you are thinking: “why would anybody write CSS in JavaScript?!” Let me explain.

### What Does CSS-in-JS Look Like?

Developers have created [different flavors of CSS-in-JS](https://github.com/michelebertoli/css-in-js). The most popular to date, with over 20,000 stars on GitHub, is a library I co-created, called [styled-components](https://styled-components.com).

Using it with React looks like this:

```js
import styled from "styled-components";

const Title = styled.h1`
  color: palevioletred;
  font-size: 18px;
`;

const App = () => <Title>Hello World!</Title>;
```

This renders a palevioletred `<h1>` with a font size of 18px to the DOM:

<Browser
  html={`
  <style>
    .faEkXI {
      font-size: 18px;
      color: palevioletred;
    }
  </style>
  <h1 class="sc-ifAKCX faEkXI">Hello World!</h1>
`}
/>

### Why I like CSS-in-JS

Primarily, **CSS-in-JS boosts my confidence**. I can add, change and delete CSS without any unexpected consequences. My changes to the styling of a component will not affect anything else. If I delete a component, I delete its CSS too. No more [append-only stylesheets](https://css-tricks.com/oh-no-stylesheet-grows-grows-grows-append-stylesheet-problem/)! ✨

<Lesson
  title="Confidence"
  body="Add, change and delete CSS without any unexpected consequences and avoid dead code."
/>

<Lesson
  title="Painless Maintenance"
  body="Never go on a hunt for CSS affecting your components ever again."
/>

Teams I have been a member of are especially benefitting from this confidence boost. I cannot expect all team members, particularly juniors, to have an encyclopedic understanding of CSS. On top of that, deadlines can get in the way of quality.

With CSS-in-JS, we automatically sidestep common CSS frustrations such as class name collisions and specificity wars. This keeps our codebase clean and lets us move quicker. 😍

<Lesson
  title="Enhanced Teamwork"
  body="Avoid common CSS frustrations to keep a neat codebase and moving quickly, regardless of experience levels."
/>

Regarding performance, CSS-in-JS libraries keep track of the components I use on a page and only inject their styles into the DOM. While my `.js` bundles are slightly heavier, my users download the smallest possible CSS payload and avoid extra network requests for `.css` files.

This leads to a marginally slower time to interactive, but a much quicker first meaningful paint! 🏎💨

<Lesson
  title="Fast Performance"
  body="Send only the critical CSS to the user for a rapid first paint."
/>

I can also easily adjust the styles of my components based on different states (`variant="primary"` vs `variant="secondary"`) or a global theme. The component will apply the correct styles automatically when I dynamically change that context. 💅

<Lesson
  title="Dynamic Styling"
  body="Simply style your components with a global theme or based on different states."
/>

CSS-in-JS still offers all the important features of CSS preprocessors. All libraries support auto-prefixing, and JavaScript offers most other features like mixins (functions) and variables natively.

---

I know what you are thinking: “Max, you can also get these benefits with other tools or strict processes or extensive training. What makes CSS-in-JS special?”

CSS-in-JS combines all these benefits into one handy package and enforces them. It guides me to the [pit of success](https://blog.codinghorror.com/falling-into-the-pit-of-success/): doing the right thing is easy, and doing the wrong thing is hard (or even impossible).

### Who Uses CSS-in-JS?

Thousands of companies use CSS-in-JS in production, including [Reddit](https://reddit.com), [Patreon](https://patreon.com), [Target](https://target.com), [Atlassian](https://atlaskit.atlassian.com), [Vogue](https://vogue.de), [GitHub](https://primer.style/components), [Coinbase](https://pro.coinbase.com), and many more. ([including this website](https://github.com/mxstbr/mxstbr.com))

### Is CSS-in-JS For You?

If you are using a JavaScript framework to build a web app with components, CSS-in-JS is probably a good fit. Especially if you are part of a team where everybody understands basic JavaScript.

If you are not sure how to get started, I would recommend trying it out and seeing for yourself how good it feels! ✌️
