import BlogPost from "../../components/BlogPost";

export const meta = {
  published: false,
  publishedAt: "2019-01-17",
  title: "How I dream of styling my React apps",
  summary: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

As the co-creator of styled-components I have spent the past four years thinking about styling React components. Prompted by a lot of conversations and inspirations I have a new dream.

It looks like this:

```js
<div
  styles={{
    flexDirection: ["column", "row"],
    margin: [1, 2],
    padding: 1,
    color: "primary"
  }}
/>
```

Look closely, there are a lot of interesting ideas in here:

- No unnecessary naming
- Enforced consistency via a built-in scale
- Per-value responsiveness
- Simple composition
- Simple refactoring
- Static typing for styles

Let's examine the benefits and tradeoffs.

### Style Objects

Compared to writing CSS in JS as strings (like styled-components uses), objects are are less familiar to developers with no JavaScript experience and are not as easily copy-and-pasted.

On the other hand, the visual noise caused by dynamic interpolations is reduced and composing objects is much simpler.

### Prop Based

Second, you'll notice that I'm passing the style object to a prop of the element. Why a prop and not the familiar `styled.x` API or a `withStyles` HOC?

Naming is one of the hardest things about coding, and with the prop there is no need to create either class names (`.name`) or intermediate components (`Name`). All you have to name is the component you are creating, nothing more.

It also makes refactoring simple, you can copy entire blocks of JSX around without worrying about other parts of your code like HOCs or styled components.

The prop is a small abstraction on top of standard React APIs, making it easy to learn. Further, it can support everything other CSS-in-JS libraries can, including adapting based on props and state, extending and theming.

#### `styles` vs. `css`

I call it `styles` vs. the (currently) more common `css` because that makes it learn once, write anywhere (like React itself). Styling your React Native or ReactVR apps with a `css` prop doesn't make sense, they don't support CSS.

#### Are these inline styles?

They could be, but are not. Inline styles are less performant than compiling to CSS and injecting it into the CSSOM, and they also do not support pseudo-selectors and other nice parts of CSS.

### Built-in Scale

Rather than specifying arbitrary values (`margin: '16px'` or `margin: 16`), only values from 1 to 10 can be specified. There is a global scale, e.g. 4-based: `4px 8px 16px 32px 64px...` (`4 * 2 ^ n`), and the value defines which step on the scale is used. For example, `margin: 2` would result in a `8px` margin.

The same thing is true for colors, rather than allowing any hex/rgb value there is a global set of colors with names, and you pass the color name rather than a raw value.

This means your app is always consistently styled. All the spacing and colors are automatically uniform, leveling up the design. You also have less mental overhead, as you no longer have to decide between a `4px` and `5px` margin, but between a `4px` and `8px` margin.

> TODO: ugly escape hatch for edge cases? maybe `import { __raw }; { margin: __raw('13px') };`

### Responsive Values

Rather than using media queries each property can be responsive (a la facepaint) with mobile-first values.

Again there is a global scale for media queries (e.g. `0px 768px 1200px 2400px`), and specifying `margin: [1, 2]` would mean that anything above 768px has a margin of 8px and everything below a margin of 4px. Need to make a grid of things a column on mobile? `flexDirection: ['column', 'row']`!

This makes it convient and quick to add responsiveness to your app. Because the media queries are mobile-first, it also encourages starting from the mobile layout first, which is a good idea for most apps.

> TODO: Maybe the prop should accept an array to allow swapping out all values? `styles={[mobile, desktop]}`, or maybe that should merge styles? not sure

### Bonus: Static Typing

The style objects can be fully statically typed with TypeScript or Flow!

### Open Questions

- Extending styles: what happens here `<CustomComp styles={{}}>`? Does it pass through `className/style`, `styles` or both?

### Implementation

Identical to emotions `css` prop, this should be implemented as a custom `React.createElement` replacement and handle server-side rendering out of the box.

All the validation should only happen in development. Since there is only simple properties, there is no need for a CSS parser either. This should have a tiny runtime bundle size (< 2kB?).

### Inspiration / Further Reading

- https://mrmrs.cc/writing/2018/06/18/component-styling-api by @mrmrs
- https://jxnblk.com/writing/posts/patterns-for-style-composition-in-react by @jxnblk
- https://style-components.com by @chantastic
  - especially https://medium.learnreact.com/scale-fud-and-style-components-c0ce87ec9772
- https://github.com/threepointone/glam by @threepointone
- https://github.com/jxnblk/rebass
- https://github.com/emotion-js/facepaint

### Primitive properties only

No media queries, pseudo selectors, pseudo elements, shorthands, or anything else.

Clarity over brevity (`margin: 1 1 2 2` vs. `{ marginTop: 1, marginBottom: 2, marginRight: 1, marginLeft: 2 }`).

Need styles on interaction? Do it in JS. CSS pseudo selectors usually do not work well on mobile, and you resolve to JS.
