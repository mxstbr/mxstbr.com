import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-01-17',
  title: 'Why CSS-in-JS?',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

CSS-in-JS is the result of the React community trying to enhance CSS for component systems. By honing in on a single use case we optimized the experience for both developers and end users.

### What is CSS-in-JS?

CSS-in-JS refers to a set of libraries that make it possible to write CSS in JavaScript. The most popular one is [styled-components](https://styled-components.com) (disclaimer: I am the co-creator), but there are [many others](https://github.com/michelebertoli/css-in-js).

For example, here is what styled-components looks like:

```JS
import styled from 'styled-components';

const Title = styled.h1`
  color: palevoiletred;
  font-size: 1.5em;
`

const App = () => (
  <Title>Hello World!</Title>
)
```

### When should you use CSS-in-JS?

If you are using a JavaScript framework like React to build your app, you would likely benefit from CSS-in-JS. It is particularly helpful for teams.

### Why would you use CSS-in-JS?

Anybody who has worked on a production website has probably seen the phenomenon of the "append-only style sheet". There is a `.css` file (or potentially multiple if using a preprocessor) that only ever gets added to, but never removed from.

When writing a global style sheet, it is impossible to know what a change will affect. The class is called `.button`, but are you sure that it is only used for buttons? If you add some padding to it, will it break any layouts?

**First and foremost, CSS-in-JS is about encapsulation.** You always know which piece of styling affects which component. This is an immense upgrade for maintenance, as deleting styles becomes obvious.

- Avoid the "append-only style sheet"
- Automatic critical CSS
- Prevent class name bugs
- Proper encapsulation
- Simple dynamic styling
- Easier maintenance
- + all the features of CSS preprocessors
