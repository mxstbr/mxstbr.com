import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-01-17',
  title: 'How I dream of styling my React apps',
  path: '/blog/my-dream-styling-react-apps',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

This is it, folks, this is how I dream of styling my React apps:

```JS
<div
  styles={{
    margin: [1, 2],
    padding: 1,
    color: colors.primary
  }}
/>
```

Look closely, there are some interesting things going on:

- Enforced consistency via a built-in scale
- Per-value media queries
- Simple composition of styles
- Statically typed styles
- Moving styles around is easy
- Minimal abstraction
- It's learn once, write anywhere just like React
- Only for folks with JS experience

Let's examine the tradeoffs!

### Style Objects

Compared to strings (a la styled-components), objects are easier to compose and statically analyse, but are less friendly to JavaScript newbies and have a learning curve.

I prefer objects. 

> Note for context: my team consists of people who know JavaScript and can handle the learning curve.

### Prop Based

Second, you'll notice that I'm passing the style object to a prop called `styles`. Why a prop and not the familiar `styled.x` API or even a `withStyles` HOC? 

With a prop, copy and pasting JSX around is easy and creating [style components](http://style-components.com) (not a typo) is simple since everything is based on standard React components, i.e. functions. You have all the benefits of the `styled.x` API too!

I called it `styles` vs. the currently more common `css` because that makes it learn once, write anywhere just like React itself. Styling your React Native or React VR apps with a `css` prop doesn't make much sense since they don't support CSS.

#### Inline Styles?

No, this is not inline styles.

Inline styles are imperformant when used across an app. Compiling to actual CSS that's injected into the DOM is faster, much faster.

### Built-in Scale

Rather than specifying arbitrary values (`margin: '16px'` or `margin: 16`), only values from 1 to 10 can be specified. There is a global scale (e.g. 4-based: `4px 8px 16px 32px 64px...` 4 * 2 ^ n) and the value defines which step on the scale is used. For example, `margin: 2` mean you have an `8px` margin.

Automatic consistency!

All your spacing is now based on a single scale, so it'll always look proportional. You no longer decide between `3px`, `4px` and `5px` margin (which are all the same anyway), you decide between three steps on the scale, each of which makes a big difference. There's always a winner!

> TODO: ugly escape hatch for edge cases? maybe `import { __raw }; { margin: __raw('13px') };`

### Responsive Values

Rather than using media queries we should allow making each property responsive a la facepaint with mobile-first values (i.e. `min-width: xyz` rather than `max-width`). 

Again there is a global scale for media queries (e.g. `0px 768px 1200px 2400px`), and specifying `margin: [1, 2]` would mean that anything above 768px has a margin of 8px and everything below a margin of 4px. Easy responsiveness ftw!

> TODO: Maybe the prop should accept an array to allow swapping out all values? `styles={[mobile, desktop]}`, or maybe that should merge styles? not sure

### Primitive properties only

No media queries, pseudo selectors, pseudo elements, shorthands, or anything else. 

Clarity over brevity (`margin: 1 1 2 2` vs. `{ marginTop: 1, marginBottom: 2, marginRight: 1, marginLeft: 2 }`). 

Need styles on interaction? Do it in JS. Simple interactions usually don't work as expected across desktop and mobile anyway.

### Bonus: Static Typing

The style objects can be fully statically typed with TypeScript or Flow! 

### Anti Goals

- Friendlyness to folks without a JavaScript background
- TBD

### Open Questions

- What happens when `<CustomComp styles={{}}>`? Does it pass through `className/style`, `styles` or both?
 
### Inspiration / Further Reading

- https://mrmrs.cc/writing/2018/06/18/component-styling-api by @mrmrs
- https://jxnblk.com/writing/posts/patterns-for-style-composition-in-react by @jxnblk
- https://style-components.com by @chantastic
  - especially https://medium.learnreact.com/scale-fud-and-style-components-c0ce87ec9772
- https://github.com/threepointone/glam by @threepointone