import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-01-17',
  title: 'How I dream of styling my React apps',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

```JS
<div
  styles={{
    flexDirection: ['column', 'row'],
    margin: [1, 2],
    padding: 1,
    color: 'primary'
  }}
/>
```

Look closely, there are some interesting things going on:

- Simple composition of styles
- Statically typed styles
- Enforced consistency via a built-in scale
- Per-value media queries
- Moving styles around is easy
- Minimal abstraction
- It's learn once, write anywhere just like React
- Only for folks with JS experience

Let's examine the benefits and tradeoffs!

### Style Objects

Compared to strings (a la styled-components), objects are easier to compose and statically analyse, but are less friendly to JavaScript newbies and have a learning curve.

I have started to prefer objects.

### Prop Based

Second, you'll notice that I'm passing the style object to a prop of the element. Why a prop and not the familiar `styled.x` API or a `withStyles` HOC? 

With a prop, copy and pasting JSX around is easy and creating [style components](http://style-components.com) (not a typo) is simple since everything is based on standard React components, i.e. functions.

This simple abstraction can support everything, including adapting based on props and state, extending styles and global theming.

#### `styles` vs. `css`

I called it `styles` vs. the currently more common `css` because that makes it learn once, write anywhere just like React itself. Styling your React Native or React VR apps with a `css` prop doesn't make sense since they don't support CSS.

#### Are these inline styles?

They could be, but are not. Inline styles are less performant than compiling to CSS and injecting it into the CSSOM.

### Built-in Scale

Rather than specifying arbitrary values (`margin: '16px'` or `margin: 16`), only values from 1 to 10 can be specified. There is a global scale, e.g. 4-based: `4px 8px 16px 32px 64px...` (`4 * 2 ^ n`), and the value defines which step on the scale is used. For example, `margin: 2` would result in a `8px` margin.

All your spacing is now based on a the same scale, so it'll always look proportional. You no longer decide between `3px`, `4px` and `5px` margin (which are all the same anyway), you decide between three widely different steps on the scale.

The same thing is true for colors, rather than allowing any hex/rgb value there is a global set of colors with names, and you pass the color name rather than a raw value.

Automatic consistency throughout your whole application!

> TODO: ugly escape hatch for edge cases? maybe `import { __raw }; { margin: __raw('13px') };`

### Responsive Values

Rather than using media queries each property can be responsive (a la facepaint) with mobile-first values.

Again there is a global scale for media queries (e.g. `0px 768px 1200px 2400px`), and specifying `margin: [1, 2]` would mean that anything above 768px has a margin of 8px and everything below a margin of 4px. Need to make a grid of things a column on mobile? `flexDirection: ['column', 'row']`!

> TODO: Maybe the prop should accept an array to allow swapping out all values? `styles={[mobile, desktop]}`, or maybe that should merge styles? not sure

### Primitive properties only

No media queries, pseudo selectors, pseudo elements, shorthands, or anything else. 

Clarity over brevity (`margin: 1 1 2 2` vs. `{ marginTop: 1, marginBottom: 2, marginRight: 1, marginLeft: 2 }`). 

Need styles on interaction? Do it in JS. CSS pseudo selectors usually do not work well on mobile, and you resolve to JS.

### Bonus: Static Typing

The style objects can be fully statically typed with TypeScript or Flow! 

### Open Questions

- Extending styles: what happens here `<CustomComp styles={{}}>`? Does it pass through `className/style`, `styles` or both?
 
### Inspiration / Further Reading

- https://mrmrs.cc/writing/2018/06/18/component-styling-api by @mrmrs
- https://jxnblk.com/writing/posts/patterns-for-style-composition-in-react by @jxnblk
- https://style-components.com by @chantastic
  - especially https://medium.learnreact.com/scale-fud-and-style-components-c0ce87ec9772
- https://github.com/threepointone/glam by @threepointone